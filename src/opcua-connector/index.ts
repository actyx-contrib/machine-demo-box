import { Pond } from '@actyx/pond'
import { OPCUAClient, UserTokenType } from 'node-opcua'
import { combineLatest } from 'rxjs/internal/observable/combineLatest'
import { Emitter, mkEmitter } from './emitter'
import { getSettings, opcuaSettings } from './settings'
import { mkStreams } from './streams'
import { VariableStream } from './types'
import { executeValueEmitter } from './values'

Pond.default().then(async (pond) => {
  const { machineName, opcua, variables, values, valuesTags } = getSettings()
  const client = OPCUAClient.create(opcuaSettings)
  await client.connect(opcua.opcuaUrl)
  const session = await client.createSession({
    type: UserTokenType.UserName,
    userName: opcua.userName,
    password: opcua.password,
  })
  console.log('connected to ', opcua.opcuaUrl, 'with', opcua.userName)

  client.on('reconnection_attempt_has_failed', () => {
    console.error('failed to reconnect. terminate to restart')
    process.exit(1)
  })

  const em = mkEmitter(pond)
  // subscribe to values and emit them to actyx
  const { streams, subscriptions } = await mkStreams(variables, session)

  executeValueEmitter(streams, values, (name, value) => {
    em.valueEvent(valuesTags, machineName, name, value)
  })

  combineLatest(streams).subscribe(executeOdaRules(em))

  // terminate app in a kind way for the opcua server

  process.on('SIGINT', async () => {
    subscriptions.forEach((sub) => sub.terminate())
    session.close()
    await client.disconnect()
    console.log('terminated')
  })
})

const executeOdaRules = (_em: Emitter) => (data: VariableStream) => {
  console.log(data)
}
