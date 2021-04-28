import { log } from './logger'
import { appSettings } from './utils'
import { dbInit, getOffsetMap, insertToDb } from './db'
import { errorExport } from './eventExporter'
import { OffsetMap, Pond, Tags } from '@actyx/pond'

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
  const pond = await Pond.default()
  log.info('init PostgreSQL connection')
  const pg = await dbInit(settings.db)
  log.info('PostgreSQL connected')

  errorExport(pond, pg)

  let lowerBound = await getOffsetMap(pg)

  let queryActive = false
  const offsetIterator: OffsetMap = lowerBound

  const bulkInsert = async (lowerBound: OffsetMap): Promise<OffsetMap> => {
    queryActive = true
    const newLowerBound = await pond.events().queryAllKnownChunked(
      {
        lowerBound,
        order: 'Asc',
        query: Tags('Machine-state', 'Machine.values'),
      },
      100,
      async (chunk) => {
        await insertToDb(pg, chunk.events, chunk.upperBound)
      },
    )
    queryActive = false
    return newLowerBound
  }

  // trigger a new export after 5 Seconds
  setInterval(() => {
    if (queryActive === false) {
      log.debug('start next export run')
      bulkInsert(offsetIterator)
        .then((bound) => (lowerBound = bound))
        .catch((e: unknown) => {
          log.error(`restart app after an exception in bulkInsert`, e)
          exitApp()
        })
    } else {
      log.warn('blocked by backpressure')
    }
  }, 5000)
  log.info('DB-Exporter started')
}
main().catch((e: unknown) => {
  console.log(e)
  exitApp()
})
