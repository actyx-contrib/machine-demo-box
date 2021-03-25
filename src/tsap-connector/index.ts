import { Pond } from '@actyx/pond'
import { main } from './plc-connect'
import { getSettings } from './settings'

Pond.default().then((pond) => main(pond, getSettings()))
