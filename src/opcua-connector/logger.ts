import { Client, SimpleLogger } from '@actyx/os-sdk'

const ax = Client()
const cs = ax.consoleService

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export let log: SimpleLogger = console

if (log === undefined) {
  log = cs.SimpleLogger({
    logName: 'opcua-connector',
    producerName: 'opcua-connector',
    producerVersion: '0.1.0',
  })
}
