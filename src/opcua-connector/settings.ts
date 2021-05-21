import { OPCUAClientOptions, MessageSecurityMode, SecurityPolicy } from 'node-opcua'
import { Rules, Settings, Values } from './types'

export const defaultSetting = {
  machineName: 'Machine 1',
  opcua: {
    opcuaUrl: 'opc.tcp://localhost:4434/UA/actyx/',
    userName: 'actyx',
    password: 'actyx',
  },
  odaTags: ['Machine:{id}', 'Machine.state:{id}'],
  valuesTags: ['Machine:{id}', 'Machine.values:{id}'],
  errorTag: ['Machine:{id}', 'error:{uuid}', 'error.Occurred'],
  variables: {
    state: { nodeId: 'ns=1;s="state"', poolRate: 100 },
    speed: { nodeId: 'ns=1;s="speed"', poolRate: 2000 },
    temp: { nodeId: 'ns=1;s="temp"', poolRate: 5000 },
    error: { nodeId: 'ns=1;s="error"', poolRate: 100 },
    errorDesc: { nodeId: 'ns=1;s="errorDescription"', poolRate: 100 },
  },
  values: {
    speed: {
      name: 'speed',
      decimal: 2,
      distinct: true,
    },
    temp: {
      name: 'temp',
      template: '{value}C°',
      decimal: 0,
      distinct: true,
    },
  } as Values,
  rules: {
    On: {
      bdeState: 1,
      rule: 'state == 1',
    },
    Off: {
      bdeState: 0,
      rule: 'state == 0',
    },
    'Error A': {
      bdeState: 10,
      rule: 'state == 3 && error == 0',
      bdeDescriptionFixed: 'Power off',
      generateError: true,
    },
    'Error B': {
      bdeState: 10,
      rule: 'state == 3 && (error == 1 || error == 2) && error != 10',
      bdeDescriptionFromPlc: 'error code: {error}',
      generateError: true,
    },
    'Error C': {
      bdeState: 10,
      rule: 'state == 3 && error > 2 && error != 10',
      bdeDescriptionFromPlc: 'critical error: {error} at {state} - {}',
      generateError: true,
    },
    Emergency: {
      bdeState: 99,
      rule: 'state == 3 && errorDesc == "Emergency"',
      bdeDescriptionFixed: 'Emergency',
      generateError: true,
    },
  } as Rules,
}

export const appSettings = <S>(defaultSettings: S): S => {
  try {
    if (process.env.APP_SETTINGS) {
      const settings = JSON.parse(process.env.APP_SETTINGS) as S

      // const validate = new Ajv().compile(schema)
      // const valid = validate(settings)
      // if (!valid) {
      //   log.error('failed to parse APP_SETTINGS', { error: validate.errors || 'unknown' })
      // }

      return settings
    }
  } catch (e) {
    console.error('failed to parse APP_SETTINGS', process.env.APP_SETTINGS)
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
  applicationUri: '',
}
