import { Pond } from '@actyx/pond'
import { OPCUAClient, ClientSubscription, UserTokenType, Variant, ClientSession } from 'node-opcua'
import { Observable } from 'rxjs'
import { combineLatest } from 'rxjs/internal/observable/combineLatest'
import { Emitter, mkEmitter } from './emitter'
import { subscribeValue } from './opcua'
import { getSettings, opcuaSettings, Settings } from './settings'

type Variables = Settings['variables']
type VariableNames = keyof Variables
type VariableStream = Record<VariableNames, Variant>

type OpcuaStreams = Record<VariableNames, Observable<Variant>>

Pond.default().then(async (pond) => {
  const { machineName, opcua, bdeTags, valuesTags, variables } = getSettings()
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

  combineLatest(streams).subscribe(executeRules(em))

  // terminate app in a kind way for the opcua server

  process.on('SIGINT', async () => {
    subscriptions.forEach((sub) => sub.terminate())
    session.close()
    await client.disconnect()
    console.log('terminated')
  })
})

const executeRules = (_em: Emitter) => (data: VariableStream) => {
  console.log(data)
}

type mkStreamsReturn = { subscriptions: ClientSubscription[]; streams: OpcuaStreams }

async function mkStreams(variables: Variables, session: ClientSession): Promise<mkStreamsReturn> {
  const subscriptions: ClientSubscription[] = []
  const streamsAcc: Partial<OpcuaStreams> = {}
  let varName: keyof Settings['variables']
  for (varName in variables) {
    const { nodeId, poolRate } = variables[varName]
    const [sub, stream] = await subscribeValue(session, nodeId, poolRate)
    subscriptions.push(sub)
    streamsAcc[varName] = stream
  }
  return {
    streams: streamsAcc as Required<typeof streamsAcc>,
    subscriptions,
  }
}
