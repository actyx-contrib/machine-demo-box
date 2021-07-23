import { appSettings } from './utils'
import { dbInit, getOffsetMap, insertToDb } from './db'
import { errorExport } from './eventExporter'
import { EventsSortOrder, OffsetMap, Pond, Tag } from '@actyx/pond'
import { mkDbExporterFish } from '../fish/DB-ExporterFish'
import { ErrorFish } from '../fish/ErrorFish'

const defaultSettings = {
  db: {
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  },
}
export type Settings = typeof defaultSettings
const settings = appSettings(defaultSettings)

const exitApp = () => process.exit(6)

const main = async () => {
  const pond = await Pond.default({
    appId: 'com.example.demobox.db-export',
    displayName: 'DB-Exporter',
    version: '1.0.0',
  })
  console.info('init PostgreSQL connection')
  const pg = await dbInit(settings.db)
  console.info('PostgreSQL connected')

  errorExport(pond, pg)

  let lowerBound = await getOffsetMap(pg)

  let queryActive = false

  const bulkInsert = (lowerBound: OffsetMap): Promise<OffsetMap> => {
    queryActive = true
    let newLowerBound = lowerBound
    return new Promise((res) =>
      pond.events().queryAllKnownChunked(
        {
          lowerBound,
          order: EventsSortOrder.Ascending,
          query: Tag('Machine.state').or(Tag('Machine.values')),
        },
        100,
        async (chunk) => {
          newLowerBound = chunk.upperBound
          console.info('add events:', { lng: chunk.events.length })
          await insertToDb(pg, chunk.events, chunk.upperBound)
        },
        () => res(newLowerBound),
      ),
    )
  }

  // trigger a new export after 5 Seconds
  setInterval(() => {
    if (queryActive === false) {
      console.debug('start next export run', { lowerBound })
      bulkInsert(lowerBound)
        .then((bound) => (lowerBound = bound))
        .catch((e: unknown) => {
          console.error(`restart app after an exception in bulkInsert`, e)
          exitApp()
        })
    } else {
      console.warn('blocked by backpressure')
    }
  }, 5000)
  console.info('DB-Exporter started')

  pond.observe(
    mkDbExporterFish(
      (a, metadata) => {
        console.log(
          Object.keys(a[0]).length,
          Object.keys(a[1]).length,
          metadata.timestampAsDate().toLocaleTimeString(),
        )
      },
      1,
      ErrorFish.registry(),
      ErrorFish.registryOpen(),
    ),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
  )
}
main().catch((e: unknown) => {
  console.log(e)
  exitApp()
})
