import { Settings } from './index'
import { Client } from 'pg'
import {
  isStateChangedEvent,
  isValueChangedEvent,
  StateChangedEvent,
  ValueChangedEvent,
} from './events'
import { ActyxEvent, Metadata, OffsetMap } from '@actyx/pond'

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

  await client.query(
    `CREATE TABLE IF NOT EXISTS public."t_error"
    (
        "id" character varying(40) COLLATE pg_catalog."default" NOT NULL,
        "timestamp" timestamp with time zone NOT NULL,
        "state" varchar(100) COLLATE pg_catalog."default" NOT NULL,
        "device" varchar(100) COLLATE pg_catalog."default" NOT NULL,
        "errorCode" integer NOT NULL,
        "description" text COLLATE pg_catalog."default" NOT NULL,
        "openTimestamp" timestamp with time zone,
        "acknowledgedTimestamp" timestamp with time zone,
        "ignoredTimestamp" timestamp with time zone,
        CONSTRAINT "t_error_pkey" PRIMARY KEY (id)
    )

    TABLESPACE pg_default;

    ALTER TABLE public."t_error"
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
  eventChunk: ActyxEvent<unknown>[],
  lowerBound: OffsetMap,
): Promise<void> => {
  await insertStateEvent(pg, eventChunk.filter(isStateChangedEvent))
  await insertValueEvent(pg, eventChunk.filter(isValueChangedEvent))
  await updateOffsetMap(pg, lowerBound)
}

const mkId = (meta: Metadata) => meta.eventId.padStart(24, '0')

export const updateOffsetMap = async (client: Client, offsetMap: OffsetMap): Promise<void> => {
  console.log('OffsetMap: ' + JSON.stringify(offsetMap))
  await client
    .query(
      'INSERT INTO public."t_offsetMap" ("id", "offsetMap") VALUES ($1, $2) ON CONFLICT ("id") DO UPDATE SET "offsetMap" = EXCLUDED."offsetMap"',
      [1, JSON.stringify(offsetMap)],
    )
    .catch((err) => console.error(err.stack, offsetMap))
}

export const insertStateEvent = async (
  client: Client,
  events: ReadonlyArray<ActyxEvent<StateChangedEvent>>,
): Promise<void> => {
  if (events.length === 0) {
    return
  }
  const values = events
    .map(({ payload, meta }) => {
      return `('${mkId(meta)}', TO_TIMESTAMP(${Math.floor(meta.timestampMicros / 1e6)}), '${
        meta.lamport
      }', '${payload.device}', '${payload.state}', '${payload.stateDesc || ' '}')`
    })
    .join(',')

  await client
    .query(
      `INSERT INTO public."t_stateChanged" ("id", "timestamp", "lamport", "device", "newState", "newStateDesc")
       VALUES ${values}
       ON CONFLICT ("id") DO NOTHING`,
    )
    .catch((err) => console.error(err.stack, events.length))
}

export const insertValueEvent = async (
  client: Client,
  events: ReadonlyArray<ActyxEvent<ValueChangedEvent>>,
): Promise<void> => {
  if (events.length === 0) {
    return
  }
  const values = events
    .map(({ payload, meta }) => {
      return `('${mkId(meta)}', TO_TIMESTAMP(${Math.floor(meta.timestampMicros / 1e6)}), '${
        meta.lamport
      }', '${payload.device}', '${payload.name}', '${payload.value}')`
    })
    .join(',')

  await client
    .query(
      `INSERT INTO public."t_valueChanged" ("id", "timestamp", "lamport", "device", "name", "value")
       VALUES ${values}
       ON CONFLICT ("id") DO NOTHING`,
    )
    .catch((err) => console.error(err.stack, events.length))
}

export type DbError = {
  id: string
  timestamp: number
  state: string
  device: string
  errorCode: number
  description: string
  openTimestamp?: number
  acknowledgedTimestamp?: number
  ignoredTimestamp?: number
}

export type DbErrors = ReadonlyArray<DbError>

export const updateErrors = async (client: Client, errors: DbErrors): Promise<void> => {
  if (errors.length === 0) {
    return
  }
  const values = errors
    .map((error) => {
      const tsOpen = error.openTimestamp ? `TO_TIMESTAMP(${error.openTimestamp})` : 'NULL'
      const tsAck = error.acknowledgedTimestamp
        ? `TO_TIMESTAMP(${error.acknowledgedTimestamp})`
        : 'NULL'
      const tsIgnored = error.ignoredTimestamp ? `TO_TIMESTAMP(${error.ignoredTimestamp})` : 'NULL'
      return `('${error.id}', TO_TIMESTAMP(${error.timestamp}), '${error.state}', '${error.device}', '${error.errorCode}', '${error.description}', ${tsOpen}, ${tsAck}, ${tsIgnored})`
    })
    .join(',')

  await client
    .query(
      `INSERT INTO public."t_error" ("id", "timestamp", "state", "device", "errorCode", "description", "openTimestamp", "acknowledgedTimestamp", "ignoredTimestamp")
       VALUES ${values}
       ON CONFLICT (id) DO UPDATE SET
       state = excluded.state,
       description = excluded.description,
       "openTimestamp" = excluded."openTimestamp",
       "acknowledgedTimestamp" = excluded."acknowledgedTimestamp",
       "ignoredTimestamp" = excluded."ignoredTimestamp";`,
    )
    .catch((err) => console.error(err.stack, errors.length))
}
