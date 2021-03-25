import { Client, SimpleLogger } from '@actyx/os-sdk'
import packageJson from '../../package.json'

const ax = Client()
const cs = ax.consoleService

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export let log: SimpleLogger = undefined

if (log === undefined) {
  log = cs.SimpleLogger({
    logName: 'db-exporter',
    producerName: 'db-exporter',
    producerVersion: packageJson.version,
  })
}
