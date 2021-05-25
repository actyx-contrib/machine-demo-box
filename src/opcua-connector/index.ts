import { Pond } from '@actyx/pond'
import { OPCUAClient, UserTokenType } from 'node-opcua'
import { mkEmitter } from './emitter'
import { executeStateEmitter } from './machineState'
import { getSettings, opcuaSettings } from './settings'
import { mkStreams } from './streams'
import { executeValueEmitter } from './values'

Pond.default().then(async (pond) => {
  // read settings
  const {
    machineName,
    opcua,
    variables,
    valueEmitters,
    valuesTags,
    odaTags,
    errorTag,
    machineStateEmitters,
  } = getSettings()

  // init OPCUA connection and open new session
  const client = OPCUAClient.create(opcuaSettings)
  await client.connect(opcua.opcuaUrl)
  const session = await client.createSession({
    type: UserTokenType.UserName,
    userName: opcua.userName,
    password: opcua.password,
  })
  client.on('reconnection_attempt_has_failed', () => {
    console.error('failed to reconnect. terminate to restart')
    process.exit(1)
  })

  console.log('connected to ', opcua.opcuaUrl, 'with', opcua.userName)

  // create eventEmitter
  const em = mkEmitter(pond)

  // subscribe to values and emit them to actyx
  const { streams, subscriptions } = await mkStreams(variables, session)

  // start value emitter based on the streams and settings,
  // each value in the settings, Receive the date from OPCUA, transform them according to the settings
  // and call the em.valueEvent function
  executeValueEmitter(streams, valueEmitters, (name, value) =>
    em.valueEvent(valuesTags, machineName, name, value),
  )

  // start the
  executeStateEmitter(
    streams,
    machineStateEmitters,
    (state: number, description: string | undefined) => {
      em.stateEvent(odaTags, machineName, state, description)
      console.log(state, description)
    },
    (id: string, error: number, description: string | undefined) => {
      console.log(id, error, description)
      em.generateError(errorTag, machineName, error, description)
    },
  )

  // terminate app in a kind way for the opcua server

  process.on('SIGINT', async () => {
    subscriptions.forEach((sub) => sub.terminate())
    session.close()
    await client.disconnect()
    console.log('terminated')
  })
})
