import { Settings } from './index'
import { log } from './logger'
import { Client } from 'pg'
import { OffsetMap, Event } from '@actyx/os-sdk'
import {
  isStateChangedEvent,
  isValueChangedEvent,
  StateChangedEvent,
  TypedEvent,
  ValueChangedEvent,
} from './events'

export const dbInit = async (settings: Settings['db']): Promise<Client> => {
  const { host, port, database, password, user } = settings
  const client = new Client({
    host,
    database,
    port,
    password,
    user,
  })
  await client.connect()
  await setupTables(client)
  return client
}

const setupTables = async (client: Client) => {
  await client.query(
    `CREATE TABLE IF NOT EXISTS public."t_offsetMap" (
      "id" integer NOT NULL,
      "offsetMap" text NOT NULL,
      CONSTRAINT "t_offsetMap_pkey" PRIMARY KEY (id)
    )

    TABLESPACE pg_default;
    ALTER TABLE public."t_offsetMap" OWNER to postgres;`,
  )
  await client.query(
    `CREATE TABLE IF NOT EXISTS public."t_stateChanged"
    (
        id character varying(40) COLLATE pg_catalog."default" NOT NULL,
        "timestamp" timestamp with time zone NOT NULL,
        "lamport" integer NOT NULL,
        "device" character varying(100) COLLATE pg_catalog."default" NOT NULL,
        "newState" integer NOT NULL,
        "newStateDesc" character varying(100) COLLATE pg_catalog."default",
        CONSTRAINT "t_stateChanged_pkey" PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

    ALTER TABLE public."t_stateChanged"
        OWNER to postgres;`,
  )

  await client.query(
    `CREATE TABLE IF NOT EXISTS public."t_valueChanged"
    (
        "id" character varying(40) COLLATE pg_catalog."default" NOT NULL,
        "timestamp" timestamp with time zone NOT NULL,
        "lamport" integer NOT NULL,
        "device" varchar(100) COLLATE pg_catalog."default" NOT NULL,
        "name" varchar(100) COLLATE pg_catalog."default" NOT NULL,
        "value" numeric,
        CONSTRAINT "t_valueChanged_pkey" PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

    ALTER TABLE public."t_valueChanged"
        OWNER to postgres;`,
  )
}

export const getOffsetMap = async (client: Client): Promise<OffsetMap> => {
  const res = await client.query<{ offsetMap: string }>(
    `SELECT "offsetMap" FROM public."t_offsetMap" WHERE "id"=1`,
  )
  if (res.rowCount > 0 && res.rows[0].offsetMap) {
    return JSON.parse(res.rows[0].offsetMap)
  } else {
    return {}
  }
}

export const insertToDb = async (
  pg: Client,
  eventList: Array<Event>,
  lowerBound: OffsetMap,
): Promise<void> => {
  await insertStateEvent(pg, eventList.filter(isStateChangedEvent))
  await insertValueEvent(pg, eventList.filter(isValueChangedEvent))
  await updateOffsetMap(pg, lowerBound)
}

const mkId = (event: Event) => String(event.lamport).padStart(12, '0') + event.stream.source

export const updateOffsetMap = async (client: Client, offsetMap: OffsetMap): Promise<void> => {
  console.log('OffsetMap: ' + JSON.stringify(offsetMap))
  await client
    .query(
      'INSERT INTO public."t_offsetMap" ("id", "offsetMap") VALUES ($1, $2) ON CONFLICT ("id") DO UPDATE SET "offsetMap" = EXCLUDED."offsetMap"',
      [1, JSON.stringify(offsetMap)],
    )
    .catch((err) => log.error(err.stack, offsetMap))
}

export const insertStateEvent = async (
  client: Client,
  events: ReadonlyArray<TypedEvent<StateChangedEvent>>,
): Promise<void> => {
  if (events.length === 0) {
    return
  }
  const values = events
    .map((event) => {
      return `('${mkId(event)}', TO_TIMESTAMP(${Math.floor(event.timestamp / 1e6)}), '${
        event.lamport
      }', '${event.payload.device}', '${event.payload.state}', '${event.payload.stateDesc || ' '}')`
    })
    .join(',')

  await client
    .query(
      `INSERT INTO public."t_stateChanged" ("id", "timestamp", "lamport", "device", "newState", "newStateDesc")
       VALUES ${values}
       ON CONFLICT ("id") DO NOTHING`,
    )
    .catch((err) => log.error(err.stack, events.length))
}

export const insertValueEvent = async (
  client: Client,
  events: ReadonlyArray<TypedEvent<ValueChangedEvent>>,
): Promise<void> => {
  if (events.length === 0) {
    return
  }
  const values = events
    .map((event) => {
      return `('${mkId(event)}', TO_TIMESTAMP(${Math.floor(event.timestamp / 1e6)}), '${
        event.lamport
      }', '${event.payload.device}', '${event.payload.name}', '${event.payload.value}')`
    })
    .join(',')

  await client
    .query(
      `INSERT INTO public."t_valueChanged" ("id", "timestamp", "lamport", "device", "name", "value")
       VALUES ${values}
       ON CONFLICT ("id") DO NOTHING`,
    )
    .catch((err) => log.error(err.stack, events.length))
}
