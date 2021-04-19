import { Pond } from '@actyx/pond'
import { mkEmitter } from '../tsap-connector/emitter'

const mkMachineName = () => 'mock machine ' + Math.floor(Math.random() * 3 + 1)

enum State {
  IDLE,
  RUNNING,
  ERROR,
}

const getNewState = (state: State): State => {
  switch (state) {
    case State.IDLE: {
      if (Math.random() > 0.25) {
        return Math.random() > 0.75 ? State.ERROR : State.RUNNING
      }
      return state
    }
    case State.RUNNING: {
      if (Math.random() > 0.5) {
        return Math.random() > 0.5 ? State.ERROR : State.IDLE
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

  let temp = 30
  let speed = 1
  let state = State.IDLE

  setInterval(() => {
    temp += Math.random() - (state === State.RUNNING ? 0.5 : 1.0)
    temp = Math.max(25, Math.min(55, temp))
    temp = Math.floor(temp * 1000) / 1000

    const machineName = mkMachineName()
    console.log('emit temp:', machineName, 'temperature', temp)
    em.valueEvent(machineName, 'temperature', temp)
  }, 2_000)

  setInterval(() => {
    const machineName = mkMachineName()
    if (state === State.RUNNING) {
      speed += (Math.random() - 0.5) * 0.1
      speed = Math.max(0.2, Math.min(1.8, speed))
      speed = Math.floor(speed * 1000) / 1000

      console.log('emit value:', machineName, 'speed', speed)
      em.valueEvent(machineName, 'speed', speed)
    } else if (speed > 0) {
      speed = 0
      console.log('emit value:', machineName, 'speed', speed)
      em.valueEvent(machineName, 'speed', speed)
    }
  }, 3_000)

  setInterval(() => {
    const newState = getNewState(state)
    if (newState !== state) {
      const machineName = mkMachineName()
      if (newState === State.ERROR) {
        const { errorCode, description } = getRandomError()
        console.log('emit error:', machineName, errorCode, description)
        em.stateEvent(machineName, errorCode, description)
        em.generateError(
          ['Machine:{id}', 'error:{uuid}', 'error.Occurred'],
          machineName,
          errorCode,
          description,
        )
      } else {
        console.log('emit state:', machineName, state, undefined)
        em.stateEvent(machineName, state, undefined)
      }
      state = newState
    }
  }, 5_000)
})
