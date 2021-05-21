import { ClientSubscription, ClientSession } from 'node-opcua'
import { subscribeValue } from './opcua'
import { OpcuaStreams, Settings, Variables } from './types'

type mkStreamsReturn = { subscriptions: ClientSubscription[]; streams: OpcuaStreams }

export const mkStreams = async (
  variables: Variables,
  session: ClientSession,
): Promise<mkStreamsReturn> => {
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
