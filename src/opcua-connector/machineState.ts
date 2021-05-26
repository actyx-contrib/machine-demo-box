import deepEqual from 'deep-equal'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/internal/operators/map'
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators'
import { OpcuaStreams, Rule, Rules, VariableStream, VariableStreamData } from './types'
import * as uuid from 'uuid'

type MachineStateEvent = {
  state: number
  stateDesc?: string
  generateError: boolean
}
type MachineStateEvents = Array<MachineStateEvent>

type MachineStateEventSource = {
  values: VariableStreamData
  name: string
  rule: Rule
}

type EmitStateHandler = (state: number, description: string | undefined) => void
type EmitErrorHandler = (id: string, error: number, description: string | undefined) => void

/**
 * Listen to all values in the stream and apply the rules if one of them changed
 * There is a little debounce to get all values who are in the same query interval
 *
 * @param streams stream of all opcua values
 * @param rules rules from the settings how an when to emit events
 * @param emitState callback when a state event needs to be emitted
 * @param emitError callback when an error event needs to be emitted
 */
export const executeStateEmitter = (
  streams: OpcuaStreams,
  rules: Rules,
  emitState: EmitStateHandler,
  emitError: EmitErrorHandler,
): void => {
  combineLatest(streams)
    .pipe(
      debounceTime(10),
      map<VariableStream, VariableStreamData>(toValues),
      map((values) => Object.entries(rules).map(validateRule(values)).filter(notUndefined)),
      map((events) => events.map(renderDescription)),
      distinctUntilChanged(deepEqual),
      tap(publishEvents(emitState, emitError)),
    )
    .subscribe()
}

/** convert the variants to the real values as any type */
const toValues = (values: VariableStream): VariableStreamData =>
  Object.entries(values).reduce(
    (acc, [key, v]) => ({ ...acc, [key]: v.value }),
    {},
  ) as VariableStreamData

/**
 * Validate the given rule with the value stream
 *
 * It will create a function, executing the code giving in the settings
 *
 * WARNING: this code is not validating the settings for any vulnerability code.
 *
 */
const validateRule =
  (values: VariableStreamData) =>
  ([name, rule]: [string, Rule]): MachineStateEventSource | undefined => {
    const vars = Object.entries(values).reduce(
      (acc, [name, value]) =>
        acc + `var ${name} = ${typeof value == 'string' ? "'" + value + "'" : value}\n`,
      '',
    )
    const expression = vars + 'return ' + rule.rule
    try {
      const res = new Function(expression)()
      if (res === true) {
        return {
          name,
          values,
          rule,
        } as MachineStateEventSource
      }
      return undefined
    } catch (e) {
      console.error(e, name, expression)
      return undefined
    }
  }

/**
 * Call the given handler by the state of the event and the applied rule.
 *
 * the rule will set the generateError flag
 */
const publishEvents =
  (emitState: EmitStateHandler, emitError: EmitErrorHandler) => (events: MachineStateEvents) =>
    events.forEach((event) => {
      if (event.generateError) {
        emitError(uuid.v4(), event.state, event.stateDesc)
      }
      emitState(event.state, event.stateDesc)
    })

/** Typed filter to filter undefined entries in an array */
const notUndefined = <T>(v: T | undefined): v is T => v !== undefined

/** render event description from the rule and from the current values */
const renderDescription = ({ values, rule, name }: MachineStateEventSource): MachineStateEvent => {
  if (rule.description) {
    const stateDesc = Object.entries(values).reduce(
      (acc, [name, value]) => replaceAll(acc, `{${name}}`, value),
      rule.description,
    )

    return {
      state: rule.state,
      stateDesc,
      generateError: rule.generateError || false,
    }
  } else {
    return {
      state: rule.state,
      stateDesc: name,
      generateError: rule.generateError || false,
    }
  }
}

/** wrapper to replace all appearances in a give text */
export const replaceAll = (text: string, placeholder: string, value: unknown): string =>
  text.replace(new RegExp(placeholder, 'g'), `${value}`)
