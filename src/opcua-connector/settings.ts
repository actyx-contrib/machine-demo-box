import { OPCUAClientOptions, MessageSecurityMode, SecurityPolicy } from 'node-opcua'

type Rules = Record<
  string,
  {
    bdeState: number
    inputs: number
    generateError?: boolean
  }
>

const defaultSetting = {
  machineName: 'Machine 1',
  opcua: {
    opcuaUrl: 'opc.tcp://localhost:4434/UA/actyx/',
    userName: 'actyx',
    password: 'actyx',
  },
  bdeTags: ['Machine:{id}', 'Machine.state:{id}'],
  valuesTags: ['Machine:{id}', 'Machine.values:{id}'],
  errorTag: ['Machine:{id}', 'error:{uuid}', 'error.Occurred'],
  bdeVariables: {
    nodeId: 'ns=1;s="state"',
    publishUnknownState: false,
  },
  analogVariables: {
    counter: {
      nodeId: 'ns=1;s="speed"',
    },
    temp: {
      nodeId: 'ns=1;s="temp"',
    },
  },
  rules: {
    On: {
      bdeState: 1,
      inputs: 0b000001,
    },
    Off: {
      bdeState: 0,
      inputs: 0b000000,
    },
    'Error A': {
      bdeState: 10,
      inputs: 0b000011,
      generateError: true,
    },
    'Error B': {
      bdeState: 10,
      inputs: 0b000010,
      generateError: true,
    },
    Emergency: {
      bdeState: 99,
      inputs: 0b10000000,
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

export type Settings = typeof defaultSetting
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
