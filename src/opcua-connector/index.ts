import { Pond } from '@actyx/pond'
import { OPCUAClient, ClientSubscription, UserTokenType } from 'node-opcua'
import { mkEmitter } from './emitter'
import { subscribeValue } from './opcua'
import { getSettings, opcuaSettings } from './settings'

Pond.default().then(async (pond) => {
  const { machineName, opcua, bdeTags, valuesTags, analogVariables } = getSettings()
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

  const subs: ClientSubscription[] = []

  const [stateSub, stateValue] = await subscribeValue(session, 'ns=1;s="state"', 100)
  subs.push(stateSub)
  stateValue.on('changed', (value) => {
    em.stateEvent(bdeTags, machineName, value.value.value)
    console.log('state', value.value.value)
  })

  Object.entries(analogVariables).forEach(async ([name, { nodeId }]) => {
    const [sub, value] = await subscribeValue(session, nodeId, 1000)
    subs.push(sub)
    value.on('changed', (value) => {
      console.log(name, value.value.value)
      em.valueEvent(valuesTags, machineName, name, +value.value.value)
    })
  })

  // terminate app in a kind way for the opcua server

  process.on('SIGINT', async () => {
    subs.forEach((sub) => sub.terminate())
    session.close()
    await client.disconnect()
    console.log('terminated')
  })
})
