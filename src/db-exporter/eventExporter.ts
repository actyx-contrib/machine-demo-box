import { Pond } from '@actyx/pond'
import { ErrorFish, State } from '../fish/ErrorFish'
import { DbError, updateErrors } from './db'
import { Client } from 'pg'
import { observeRegistry } from '@actyx-contrib/registry'

const translateToDbErrors = (state: State): DbError => {
  switch (state.type) {
    case 'undefined':
      return {
        id: state.errorId,
        timestamp: 0,
        state: state.type,
        device: 'undefined',
        errorCode: 0,
        description: '',
      }
    case 'untouched':
      return {
        id: state.errorId,
        timestamp: Math.floor(state.timestampMicros / 1e6),
        state: state.type,
        device: state.machineName,
        errorCode: state.errorCode,
        description: state.description || '',
      }
    case 'touched':
      return {
        id: state.errorId,
        timestamp: Math.floor(state.timestampMicros / 1e6),
        state: state.type,
        device: state.machineName,
        errorCode: state.errorCode,
        description: state.description || '',
        openTimestamp: Math.floor(state.openTimestampMicros[0] / 1e6),
      }
    case 'acknowledged':
    case 'ignored':
      return {
        id: state.errorId,
        timestamp: Math.floor(state.timestampMicros / 1e6),
        state: state.type,
        device: state.machineName,
        errorCode: state.errorCode,
        description: state.description || '',
        openTimestamp: Math.floor(state.openTimestampMicros[0] / 1e6),
        acknowledgedTimestamp: state.acknowledgedTimestampMicros[0]
          ? Math.floor(state.acknowledgedTimestampMicros[0] / 1e6)
          : undefined,
        ignoredTimestamp: state.ignoredTimestampMicros[0]
          ? Math.floor(state.ignoredTimestampMicros[0] / 1e6)
          : undefined,
      }
  }
}

export const errorExport = async (pond: Pond, pg: Client): Promise<void> => {
  observeRegistry(pond, ErrorFish.registry(), Object.keys, ErrorFish.of, (errors) => {
    updateErrors(
      pg,
      errors.map((error) => translateToDbErrors(error)),
    )
  })
}
