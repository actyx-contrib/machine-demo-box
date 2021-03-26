import { RxPond } from '@actyx-contrib/rx-pond'
import { ErrorFish, State } from '../fish/ErrorFish'
import { combineLatest } from 'rxjs'
import { switchMap, map } from 'rxjs/operators'
import { DbError, DbErrors, updateErrors } from './db'
import { Client } from 'pg'

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

export const errorExport = async (pg: Client): Promise<void> => {
  const pond = await RxPond.default()

  pond
    .observe(ErrorFish.registry())
    .pipe(
      map((regState) => Object.keys(regState)),
      switchMap((errorIds) =>
        combineLatest(errorIds.map((errorId) => pond.observe(ErrorFish.of(errorId)))),
      ),
      map((errorStates): DbErrors => errorStates.map((error) => translateToDbErrors(error))),
    )
    .subscribe((errors) => updateErrors(pg, errors))
}

// npm i @actyx-contrib/rx-pond
// npm i rxjs
