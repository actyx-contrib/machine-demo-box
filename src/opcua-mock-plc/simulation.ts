import { Variant, DataType, Namespace, UAObject } from 'node-opcua'

enum State {
  IDLE,
  RUNNING,
  ERROR,
}

export const simulateMachine = (device: UAObject, namespace: Namespace): void => {
  // PLC state
  let state = State.IDLE
  let speed = 0
  let temp = 20

  // simulate PLC behavior
  setInterval(() => {
    temp += (Math.random() - (state === State.RUNNING ? 0.5 : 1.0)) * 0.1
    temp = Math.max(25, Math.min(55, temp))
    temp = Math.floor(temp * 1000) / 1000
  }, 2_500)

  setInterval(() => {
    if (state === State.RUNNING) {
      speed += (Math.random() - 0.5) * 0.1
      speed = Math.max(0.2, Math.min(1.8, speed))
      speed = Math.floor(speed * 1000) / 1000
    } else if (speed > 0) {
      speed = 0
    }
  }, 4_000)

  setInterval(() => {
    const lastState = state
    switch (state) {
      case State.IDLE: {
        if (Math.random() > 0.25) {
          state = Math.random() > 0.95 ? State.ERROR : State.RUNNING
        }
        break
      }
      case State.RUNNING: {
        if (Math.random() > 0.93) {
          state = Math.random() > 0.6 ? State.ERROR : State.IDLE
        }
        break
      }
      case State.ERROR: {
        if (Math.random() > 0.66) {
          state = Math.random() > 0.8 ? State.RUNNING : State.IDLE
        }
        break
      }
    }
    console.log('change state from: ', lastState, state)
  }, 10_000)

  namespace.addVariable({
    componentOf: device,
    browseName: 'State',
    dataType: 'Int16',
    nodeId: 'ns=1;s="state"',
    value: {
      get: () => {
        return new Variant({ dataType: DataType.Int16, value: state })
      },
    },
  })
  namespace.addVariable({
    componentOf: device,
    browseName: 'Speed',
    dataType: 'Float',
    nodeId: 'ns=1;s="speed"',
    value: {
      get: () => {
        return new Variant({ dataType: DataType.Float, value: speed })
      },
    },
  })
  namespace.addVariable({
    componentOf: device,
    browseName: 'Temperature',
    dataType: 'Float',
    nodeId: 'ns=1;s="temp"',
    value: {
      get: () => {
        return new Variant({ dataType: DataType.Float, value: temp })
      },
    },
  })
}
