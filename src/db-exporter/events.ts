import * as t from 'io-ts'
import { isRight } from 'fp-ts/lib/Either'
import { ActyxEvent } from '@actyx/pond'

export const stateChangedEvent = t.intersection([
  t.type({
    eventType: t.literal('status_changed'),
    device: t.string,
    state: t.number,
  }),
  t.partial({
    stateDesc: t.string,
  }),
])
export type StateChangedEvent = t.TypeOf<typeof stateChangedEvent>
export type StateChangedEvents = StateChangedEvent[]

export const isStateChangedEvent = (
  event: ActyxEvent<unknown>,
): event is ActyxEvent<StateChangedEvent> => {
  return isRight(stateChangedEvent.decode(event.payload))
}

export const valueChangedEvent = t.type({
  eventType: t.literal('value_changed'),
  device: t.string,
  name: t.string,
  value: t.number,
})
export type ValueChangedEvent = t.TypeOf<typeof valueChangedEvent>
export type ValueChangedEvents = ValueChangedEvent[]

export const isValueChangedEvent = (
  event: ActyxEvent<unknown>,
): event is ActyxEvent<ValueChangedEvent> => isRight(valueChangedEvent.decode(event.payload))
