import {
  AttributeIds,
  ClientSession,
  ClientSubscription,
  DataValue,
  MonitoringMode,
  MonitoringParametersOptions,
  TimestampsToReturn,
  Variant,
} from 'node-opcua'
import { OpcuaStreams, Settings, Variables } from './types'
import { fromEvent, Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'

export const subscribeValue = async (
  session: ClientSession,
  nodeId: string,
  samplingInterval: number,
): Promise<[ClientSubscription, Observable<Variant>]> => {
  const nodeIdSub = {
    nodeId,
    attributeId: AttributeIds.Value,
  }
  const subscription = await session.createSubscription2({
    requestedPublishingInterval: 1000,
    requestedLifetimeCount: 1000,
    requestedMaxKeepAliveCount: 20,
    maxNotificationsPerPublish: 10,
    publishingEnabled: true,
    priority: 10,
  })

  const requestedParameters: MonitoringParametersOptions = {
    samplingInterval,
    discardOldest: true,
    queueSize: 10,
  }
  const value = await subscription.monitor(
    nodeIdSub,
    requestedParameters,
    TimestampsToReturn.Server,
    MonitoringMode.Reporting,
  )

  const stream = fromEvent(value, 'changed').pipe(
    filter((v): v is DataValue => typeof v === 'object' && v !== null && v.hasOwnProperty('value')),
    map((v) => v.value),
  )

  return [subscription, stream]
}

type mkStreamsReturn = { subscriptions: ClientSubscription[]; streams: OpcuaStreams }

export const mkStreams = async (
  variables: Variables,
  session: ClientSession,
): Promise<mkStreamsReturn> => {
  const subscriptions: ClientSubscription[] = []
  const streamsAcc: Partial<OpcuaStreams> = {}
  let varName: keyof Settings['variables']
  for (varName in variables) {
    const { nodeId, pollRate } = variables[varName]
    const [sub, stream] = await subscribeValue(session, nodeId, pollRate)
    subscriptions.push(sub)
    streamsAcc[varName] = stream
  }

  const streams = streamsAcc as OpcuaStreams

  return { streams, subscriptions }
}
