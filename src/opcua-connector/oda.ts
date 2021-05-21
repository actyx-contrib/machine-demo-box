import { combineLatest } from 'rxjs'
import { OpcuaStreams, Rules } from './types'
// import * as uuid from 'uuid'
import { tap } from 'rxjs/operators'

export const executeOdaRules = (
  streams: OpcuaStreams,
  _rules: Rules,
  _emitState: (state: string, description: number) => void,
  _emitError: (id: string, state: string, description: number) => void,
): void => {
  combineLatest(streams).pipe(tap(console.log)).subscribe()
}
