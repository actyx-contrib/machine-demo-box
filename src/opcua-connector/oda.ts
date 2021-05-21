import deepEqual from 'deep-equal'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/internal/operators/map'
import { distinctUntilChanged, tap } from 'rxjs/operators'
import { OpcuaStreams, Rule, Rules, VariableStream, VariableStreamData } from './types'
// import * as uuid from 'uuid'
// import { tap } from 'rxjs/operators'

type OdaEvent = {
  state: string
  stateDesc: string
  generateError: boolean
}
type OdaEvents = Array<OdaEvent>
type EmitStateHandler = (state: string, description: number) => void
type EmitErrorHandler = (id: string, state: string, description: number) => void

export const executeOdaRules = (
  streams: OpcuaStreams,
  rules: Rules,
  emitState: EmitStateHandler,
  emitError: EmitErrorHandler,
): void => {
  combineLatest(streams)
    .pipe(
      map<VariableStream, VariableStreamData>(toValues),
      map((values) => Object.entries(rules).map(validateRule(values)).filter(notUndefined)),
      distinctUntilChanged(deepEqual),
      tap(publishEvents(emitState, emitError)),
    )
    .subscribe()
}

const toValues = (values: VariableStream): VariableStreamData =>
  Object.entries(values).reduce(
    (acc, [key, v]) => ({ ...acc, [key]: v.value }),
    {},
  ) as VariableStreamData

const validateRule = (values: VariableStream) => ([name, rule]: [string, Rule]):
  | OdaEvent
  | undefined => {
  const vars = Object.entries(values).reduce(
    (acc, [name, value]) =>
      acc + `var ${name} = ${typeof value == 'string' ? "'" + value + "'" : value}\n`,
    '',
  )
  const expression = vars + 'return ' + rule.rule
  try {
    const res = new Function(expression)()
    // console.log(name, expression, res)
    if (res === true) {
      return {
        state: name,
        stateDesc: 'a',
        generateError: rule.generateError,
      } as OdaEvent
    }
    return undefined
  } catch (e) {
    console.error(e, name, expression)
    return undefined
  }
}

const publishEvents = (_emitState: EmitStateHandler, _emitError: EmitErrorHandler) => (
  events: OdaEvents,
) => {
  console.log(events)
}

const notUndefined = <T>(v: T | undefined): v is T => v !== undefined

export const replaceAll = (text: string, placeholder: string, value: any): string =>
  text.replace(new RegExp(placeholder, 'g'), `${value}`)
