import {
  AttributeIds,
  ClientMonitoredItem,
  ClientSession,
  ClientSubscription,
  MonitoringMode,
  MonitoringParametersOptions,
  TimestampsToReturn,
} from 'node-opcua'

export const subscribeValue = async (
  session: ClientSession,
  nodeId: string,
  samplingInterval: number,
): Promise<[ClientSubscription, ClientMonitoredItem]> => {
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

  return [subscription, value]
}
