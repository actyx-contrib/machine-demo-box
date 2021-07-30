import { Pond } from '@actyx/pond'
import { main } from './plc-connect'
import { getSettings } from './settings'

Pond.default({
  appId: 'com.example.demobox.tsap-connector',
  displayName: 'TSAP Connector',
  version: '1.0.0',
}).then((pond) => main(pond, getSettings()))
