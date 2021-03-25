import { readValues, Values } from './plc-connect'
import { mkEmitter } from './emitter'
import { getSettings } from './settings'
import { Pond, Tags } from '@actyx/pond'

const settings = getSettings()

const fakePond = ({
  emit: (_tags: Tags<unknown>, _payload: unknown) => undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any) as Pond

describe('tsap-connector', () => {
  describe('readValues', () => {
    it('publish one update', () => {
      const emitSpy = spyOn(mkEmitter(fakePond).actyx, 'emit')
      const stateSpy = spyOn(mkEmitter(fakePond), 'stateEvent')
      const valueSpy = spyOn(mkEmitter(fakePond), 'valueEvent')

      const event: Values = {
        counter: 10,
        temp: 20,
        bde: 0b0000011,
      }
      const changes = [event]
      const lastState = changes.reduce(
        (acc, value) => readValues(fakePond, acc, settings)(undefined, value),
        {},
      )

      expect(emitSpy).toBeCalledTimes(1)
      expect(stateSpy).toBeCalledTimes(1)
      expect(stateSpy).nthCalledWith(1, settings.machineName, 10, 'Error A')
      expect(valueSpy).toBeCalledTimes(2)
      expect(valueSpy).nthCalledWith(1, settings.machineName, 'counter', 10)
      expect(valueSpy).nthCalledWith(2, settings.machineName, 'temp', 20)

      expect(lastState.bde).toBe(3)
      expect(lastState.counter).toBe(10)
      expect(lastState.temp).toBe(20)
    })

    it('publish two updates', () => {
      const emitSpy = spyOn(mkEmitter(fakePond).actyx, 'emit')
      const stateSpy = spyOn(mkEmitter(fakePond), 'stateEvent')
      const valueSpy = spyOn(mkEmitter(fakePond), 'valueEvent')

      const error1: Values = {
        counter: 10,
        temp: 20,
        bde: 0b0000011,
      }
      const error2: Values = {
        counter: 10,
        temp: 20,
        bde: 0b0000010,
      }
      const lastState = [error1, error2].reduce(
        (acc, value) => readValues(fakePond, acc, settings)(undefined, value),
        {},
      )

      expect(emitSpy).toBeCalledTimes(2)
      expect(stateSpy).toBeCalledTimes(2)
      expect(stateSpy).nthCalledWith(1, settings.machineName, 10, 'Error A')
      expect(stateSpy).nthCalledWith(2, settings.machineName, 10, 'Error B')
      expect(valueSpy).toBeCalledTimes(2)
      expect(valueSpy).nthCalledWith(1, settings.machineName, 'counter', 10)
      expect(valueSpy).nthCalledWith(2, settings.machineName, 'temp', 20)
      expect(lastState.bde).toBe(2)
      expect(lastState.counter).toBe(10)
      expect(lastState.temp).toBe(20)
    })

    it('publish two updates one analog value', () => {
      const emitSpy = spyOn(mkEmitter(fakePond).actyx, 'emit')
      const stateSpy = spyOn(mkEmitter(fakePond), 'stateEvent')
      const valueSpy = spyOn(mkEmitter(fakePond), 'valueEvent')

      const event1: Values = {
        temp: 20,
        bde: 0b0000001,
      }
      const event2: Values = {
        temp: 30,
        bde: 0b0000001,
      }
      const lastState = [event1, event2].reduce(
        (acc, value) => readValues(fakePond, acc, settings)(undefined, value),
        {},
      )

      expect(emitSpy).toBeCalledTimes(0)
      expect(stateSpy).toBeCalledTimes(1)
      expect(stateSpy).nthCalledWith(1, settings.machineName, 1, 'On')
      expect(valueSpy).toBeCalledTimes(2)
      expect(valueSpy).nthCalledWith(1, settings.machineName, 'temp', 20)
      expect(valueSpy).nthCalledWith(2, settings.machineName, 'temp', 30)
      expect(lastState.bde).toBe(1)
      expect(lastState.temp).toBe(30)
    })

    it('publish two updates bde to 0', () => {
      const emitSpy = spyOn(mkEmitter(fakePond).actyx, 'emit')
      const stateSpy = spyOn(mkEmitter(fakePond), 'stateEvent')

      const event1: Values = { bde: 0b0000001 }
      const event2: Values = { bde: 0b0000000 }
      const lastState = [event1, event2].reduce(
        (acc, value) => readValues(fakePond, acc, settings)(undefined, value),
        {},
      )

      expect(emitSpy).toBeCalledTimes(0)
      expect(stateSpy).toBeCalledTimes(2)
      expect(stateSpy).nthCalledWith(1, settings.machineName, 1, 'On')
      expect(stateSpy).nthCalledWith(2, settings.machineName, 0, 'Off')
      expect(lastState.bde).toBe(0)
    })
  })
})
