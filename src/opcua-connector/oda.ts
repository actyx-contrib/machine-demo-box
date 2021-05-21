import deepEqual from 'deep-equal'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/internal/operators/map'
import { distinctUntilChanged, tap } from 'rxjs/operators'
import { OpcuaStreams, Rule, Rules, VariableStream, VariableStreamData } from './types'
import * as uuid from 'uuid'
// import { tap } from 'rxjs/operators'

type OdaEvent = {
  state: number
  stateDesc?: string
  generateError: boolean
}
type OdaEvents = Array<OdaEvent>

type OdaEventSource = {
  values: VariableStreamData
  name: string
  rule: Rule
}

type EmitStateHandler = (state: number, description: string | undefined) => void
type EmitErrorHandler = (id: string, error: number, description: string | undefined) => void

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
      map((events) => events.map(renderDescription)),
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

const validateRule = (values: VariableStreamData) => ([name, rule]: [string, Rule]):
  | OdaEventSource
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
        name,
        values,
        rule,
      } as OdaEventSource
    }
    return undefined
  } catch (e) {
    console.error(e, name, expression)
    return undefined
  }
}

const publishEvents = (emitState: EmitStateHandler, emitError: EmitErrorHandler) => (
  events: OdaEvents,
) =>
  events.forEach((event) => {
    if (event.generateError) {
      emitError(uuid.v4(), event.state, event.stateDesc)
    }
    emitState(event.state, event.stateDesc)
  })

const notUndefined = <T>(v: T | undefined): v is T => v !== undefined

const renderDescription = ({ values, rule, name }: OdaEventSource): OdaEvent => {
  if (rule.odaDescription) {
    const stateDesc = Object.entries(values).reduce(
      (acc, [name, value]) => replaceAll(acc, `{${name}}`, value),
      rule.odaDescription,
    )

    return {
      state: rule.odaState,
      stateDesc,
      generateError: rule.generateError || false,
    }
  } else {
    return {
      state: rule.odaState,
      stateDesc: name,
      generateError: rule.generateError || false,
    }
  }
}

export const replaceAll = (text: string, placeholder: string, value: any): string =>
  text.replace(new RegExp(placeholder, 'g'), `${value}`)
