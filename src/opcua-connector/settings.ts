import { OPCUAClientOptions, MessageSecurityMode, SecurityPolicy } from 'node-opcua'
import { Rules, Settings, Values, VariableSettings } from './types'
import Ajv from 'ajv'
import schema from './settings-schema.json'

export const defaultSetting = {
  machineName: 'Machine 1',
  opcua: {
    opcuaUrl: 'opc.tcp://localhost:4434/UA/actyx/',
    userName: 'actyx',
    password: 'actyx',
  },
  stateTags: ['Machine:{id}', 'Machine.state:{id}'],
  valuesTags: ['Machine:{id}', 'Machine.values:{id}'],
  errorTag: ['Machine:{id}', 'error:{uuid}', 'error.Occurred'],
  variables: {
    state: { nodeId: 'ns=1;s="state"', pollRate: 100 },
    speed: { nodeId: 'ns=1;s="speed"', pollRate: 2000 },
    temp: { nodeId: 'ns=1;s="temp"', pollRate: 5000 },
    error: { nodeId: 'ns=1;s="error"', pollRate: 100 },
    errorDesc: { nodeId: 'ns=1;s="errorDescription"', pollRate: 100 },
  } as VariableSettings,
  valueEmitters: {
    speed: {
      name: 'speed',
      decimal: 2,
      distinct: true,
    },
    temp: {
      name: 'temperature',
      // template: '{value}C°',
      decimal: 1,
      distinct: true,
    },
  } as Values,
  machineStateEmitters: {
    Off: {
      state: 0,
      rule: 'state == 0',
    },
    On: {
      state: 1,
      rule: 'state == 1',
    },
    'Power off': {
      state: 10,
      rule: 'state == 2 && error == 0',
      description: 'Power off',
      generateError: true,
    },
    Error: {
      state: 10,
      rule: 'state == 2 && (error == 1 || error == 2)',
      description: 'error code: {error}',
      generateError: true,
    },
    'Critical Error': {
      state: 10,
      rule: 'state == 2 && error > 2 && error != 10',
      description: 'critical error: {error} at {state} - {errorDesc}',
      generateError: true,
    },
    Emergency: {
      state: 99,
      rule: 'state == 2 && errorDesc == "Emergency"',
      description: 'Emergency',
      generateError: true,
    },
  } as Rules,
}

export const appSettings = <S>(defaultSettings: S): S => {
  try {
    process.env.APP_SETTINGS = JSON.stringify(defaultSettings)
    if (process.env.APP_SETTINGS) {
      const settings = JSON.parse(process.env.APP_SETTINGS) as S
      const validate = new Ajv().compile(schema)
      const valid = validate(settings)
      if (!valid) {
        console.error('failed to validate APP_SETTINGS', { error: validate.errors || 'unknown' })
      }

      return settings
    }
  } catch (e) {
    console.error('failed to parse APP_SETTINGS', e, process.env.APP_SETTINGS)
  }
  return defaultSettings
}

export const getSettings = (): Settings => appSettings(defaultSetting)

export const opcuaSettings: OPCUAClientOptions = {
  applicationName: 'opcua-connector',
  connectionStrategy: {
    initialDelay: 1000,
    maxRetry: 1,
  },
  securityMode: MessageSecurityMode.None,
  securityPolicy: SecurityPolicy.None,
  endpoint_must_exist: false,
}
