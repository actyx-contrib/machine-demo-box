import { Client, OffsetMap, Ordering, Event, Subscription } from '@actyx/os-sdk'
import { log } from './logger'
import { appSettings } from './utils'
import { dbInit, getOffsetMap, insertToDb } from './db'

const ax = Client()
const es = ax.eventService

const defaultSettings = {
  db: {
    host: '192.168.150.74',
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
  log.info('init PostgreSQL connection')
  const pg = await dbInit(settings.db)
  log.info('PostgreSQL connected')

  const lowerBound = await getOffsetMap(pg)

  let queryActive = false
  const offsetIterator: OffsetMap = lowerBound
  const subscriptions: Subscription[] = [
    { streamSemantics: 'machine-state' },
    { streamSemantics: 'machine-values' },
  ]

  const bulkInsert = async (lowerBound: OffsetMap) => {
    let eventList: Array<Event> = []
    queryActive = true

    const current = await es.offsetsPromise()
    es.query({
      lowerBound,
      upperBound: current,
      ordering: Ordering.Lamport,
      subscriptions,
      onEvent: (event) => {
        if (event.offset > (offsetIterator[event.stream.source] || 0)) {
          offsetIterator[event.stream.source] = event.offset
        }
        eventList.push(event)
        if (eventList.length > 100) {
          insertToDb(pg, eventList, offsetIterator)
          eventList = []
        }
      },
      onDone: async () => {
        await insertToDb(pg, eventList, offsetIterator)
        queryActive = false
      },
      onError: () => {
        queryActive = false
      },
    })
  }
  setInterval(() => {
    if (queryActive === false) {
      log.debug('start next export run')
      bulkInsert(offsetIterator).catch((e: unknown) => {
        log.error(`restart app after an exception in bulkInsert`, e)
        exitApp()
      })
    } else {
      log.warn('blocked by backpressure')
    }
  }, 5000)
  log.info('started')
}
main().catch((e: unknown) => {
  console.log(e)
  exitApp()
})
