import { log } from './logger'

import nodes7, { ReadAllCallback } from 'nodes7'
import { Settings } from './settings'
import { mkEmitter } from './emitter'
import { Pond } from '@actyx/pond'

export type Values = Record<string, number | undefined>

export const main = (actyx: Pond, settings: Settings): void => {
  // prep variables
  const analogVars = Object.entries(settings.analogVariables).reduce<Record<string, string>>(
    (acc, [key, { address }]) => ({ ...acc, [key]: address }),
    {},
  )
  const variables = {
    bde: settings.bdeVariables.address,
    ...analogVars,
  }

  // start plc connection
  const plc = new nodes7()
  plc.initiateConnection(settings.tsap, (error) => {
    if (error) {
      log.error('failed to connect to plc', error)
      process.exit(6)
      return
    }

    // configure nodes7 connection
    plc.setTranslationCB((tag) => variables[tag as keyof typeof variables])
    plc.addItems(Object.keys(variables))

    // pool state of the variables in settings.pollInterval
    let lastState: Values = {
      bde: undefined,
    }
    setInterval(() => {
      plc.readAllItems<Values>(
        (...params) => (lastState = readValues(actyx, lastState, settings)(...params)),
      )
    }, settings.pollInterval)
  })
}

export const readValues = (
  actyx: Pond,
  lastValue: Values,
  settings: Settings,
): ReadAllCallback<Values> => {
  const bdeMask = parseInt(settings.bdeVariables.mask, 2)

  return (error: unknown, values: Values): Values => {
    if (error) {
      log.error('failed to read values from PLC', error)
      return lastValue
    }
    const { bde, ...analog } = values
    const { bde: lastBde, ...lastAnalog } = lastValue

    if (bde !== undefined && (lastBde === undefined || (bde & bdeMask) !== (lastBde & bdeMask))) {
      const newState = Object.entries(settings.rules).find((entry) => entry[1].inputs === bde)

      if (newState) {
        const [stateDesc, state] = newState
        mkEmitter(actyx).stateEvent(settings.machineName, state.bdeState, stateDesc)
        if (state.generateError) {
          mkEmitter(actyx).generateError(
            settings.errorTag,
            settings.machineName,
            state.bdeState,
            stateDesc,
          )
        }
      } else if (settings.bdeVariables.publishUnknownState) {
        mkEmitter(actyx).stateEvent(settings.machineName, 1000, 'Unknown')
      } else {
        log.debug('ignore new BDE state: ', { lastBde, bde })
      }
    }

    const analogValueKeys = Object.keys(analog)
    analogValueKeys.forEach((key) => {
      const value = analog[key]
      if (value && value !== lastAnalog[key]) {
        mkEmitter(actyx).valueEvent(settings.machineName, key, value)
        lastAnalog[key] = value
      }
    })

    return values
  }
}

// https://github.com/plcpeople/nodeS7
// npm i @st-one-io/nodes7
