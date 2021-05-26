import { Variant } from 'node-opcua'
import { Observable } from 'rxjs'
import { defaultSetting } from './settings'

export type Rule = {
  state: number
  description?: string
  /** expression to validate state */
  rule: string
  generateError?: boolean
}
export type Rules = Record<string, Rule>

export type Value = {
  name: string
  template?: string
  decimal?: number
  scale?: number
  distinct: boolean
}
export type Values = Record<string, Value>

export type Variable = {
  nodeId: string
  pollRate: number
}
export type VariableSettings = Record<string, Variable>

export type Settings = typeof defaultSetting

export type Variables = Settings['variables']
export type VariableNames = keyof Variables
export type VariableStream = Record<VariableNames, Variant>
export type VariableStreamData = Record<VariableNames, any>

export type OpcuaStreams = Record<VariableNames, Observable<Variant>>
