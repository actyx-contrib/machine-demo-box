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
