import { log } from './logger'

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
  tsap: {
    port: 102,
    host: '192.168.0.1',
    localTSAP: 0x0100,
    remoteTSAP: 0x0200,
    timeout: 8000,
  },
  pollInterval: 500,
  errorTag: ['Machine:{id}', 'error:{uuid}', 'error.Occurred'],
  bdeVariables: {
    address: 'IB0',
    mask: '10000111',
    publishUnknownState: false,
  },
  analogVariables: {
    counter: {
      address: 'DB1,INT1040',
    },
    temp: {
      address: 'DB1,INT1042',
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
      return JSON.parse(process.env.APP_SETTINGS) as S
    }
  } catch (e) {
    log.error('failed to parse APP_SETTINGS', process.env)
  }
  return defaultSettings
}

export type Settings = typeof defaultSetting
export const getSettings = (): Settings => appSettings(defaultSetting)
