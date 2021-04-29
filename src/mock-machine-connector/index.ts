import { Pond } from '@actyx/pond'
import { mkEmitter } from '../tsap-connector/emitter'

const machines = ['mock machine 1', 'mock machine 2', 'mock machine 3']

enum State {
  IDLE,
  RUNNING,
  ERROR,
}

const getNewState = (state: State): State => {
  switch (state) {
    case State.IDLE: {
      if (Math.random() > 0.25) {
        return Math.random() > 0.85 ? State.ERROR : State.RUNNING
      }
      return state
    }
    case State.RUNNING: {
      if (Math.random() > 0.93) {
        return Math.random() > 0.6 ? State.ERROR : State.IDLE
      }
      return state
    }
    case State.ERROR: {
      if (Math.random() > 0.75) {
        return Math.random() > 0.8 ? State.IDLE : State.ERROR
      }
      return state
    }
  }
}

type RandomError = {
  errorCode: number
  description?: string
}

const getRandomError = (): RandomError => {
  return {
    errorCode: Math.floor(Math.random() * 10) + 10,
    description: Math.random() > 0.5 ? 'some error' : undefined,
  }
}

Pond.default().then((pond) => {
  const em = mkEmitter(pond)

  machines.forEach((name) => {
    let lastTemp = 30
    let lastSpeed = 1
    let lastState = State.IDLE

    setInterval(() => {
      let currentTemp = lastTemp

      currentTemp += (Math.random() - (lastState === State.RUNNING ? 0.5 : 1.0)) * 0.1
      currentTemp = Math.max(25, Math.min(55, currentTemp))
      currentTemp = Math.floor(currentTemp * 1000) / 1000

      if (lastTemp !== currentTemp) {
        console.log('emit temp:', name, 'temperature', currentTemp)
        em.valueEvent(['Machine:{id}', 'Machine.values:{id}'], name, 'temperature', currentTemp)
        lastTemp = currentTemp
      }
    }, 2_500)

    setInterval(() => {
      let machineSpeed = lastSpeed
      if (lastState === State.RUNNING) {
        machineSpeed += (Math.random() - 0.5) * 0.1
        machineSpeed = Math.max(0.2, Math.min(1.8, machineSpeed))
        machineSpeed = Math.floor(machineSpeed * 1000) / 1000

        if (lastSpeed !== machineSpeed) {
          console.log('emit value:', name, 'speed', machineSpeed)
          em.valueEvent(['Machine:{id}', 'Machine.values:{id}'], name, 'speed', machineSpeed)
        }
      } else if (machineSpeed > 0) {
        machineSpeed = 0
        console.log('emit value:', name, 'speed', machineSpeed)
        em.valueEvent(['Machine:{id}', 'Machine.values:{id}'], name, 'speed', machineSpeed)
      }
      lastSpeed = machineSpeed
    }, 4_000)

    setInterval(() => {
      const newState = getNewState(lastState)
      if (newState !== lastState) {
        if (newState === State.ERROR) {
          const { errorCode, description } = getRandomError()
          console.log('emit error:', name, errorCode, description)
          em.stateEvent(['Machine:{id}', 'Machine.state:{id}'], name, errorCode, description)
          em.generateError(
            ['Machine:{id}', 'error:{uuid}', 'error.Occurred'],
            name,
            errorCode,
            description,
          )
        } else {
          console.log('emit state:', name, lastState, undefined)
          em.stateEvent(['Machine:{id}', 'Machine.state:{id}'], name, lastState, undefined)
        }
        lastState = newState
      }
    }, 10_000)
  })
})
