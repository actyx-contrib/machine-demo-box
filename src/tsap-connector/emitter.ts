import { StateChangedEvent, ValueChangedEvent } from '../db-exporter/events'
import { Pond, Tag, Tags } from '@actyx/pond'
import * as uuid from 'uuid'

export const renderTag =
  (machineName: string, errorId: string) =>
  (rawTag: string): Tags<unknown> => {
    if (rawTag.endsWith(':{id}')) {
      return Tag(rawTag.split(':')[0]).withId(machineName)
    } else if (rawTag.endsWith(':{uuid}')) {
      return Tag(rawTag.split(':')[0]).withId(errorId)
    } else {
      return Tag(rawTag)
    }
  }
export const renderTags = (tags: string[], machineName: string, errorId: string): Tags<unknown> =>
  tags.map(renderTag(machineName, errorId)).reduce((acc, tag) => acc.and(tag), Tags())

type Emitter = {
  actyx: Pond
  stateEvent: (
    tagArray: Array<string>,
    machineName: string,
    state: number,
    stateDesc?: string,
  ) => void
  valueEvent: (tagArray: Array<string>, machineName: string, name: string, value: number) => void
  generateError: (
    tagArray: Array<string>,
    machineName: string,
    errorCode: number,
    description?: string,
  ) => void
}

let emitter: Emitter | undefined = undefined

export const mkEmitter = (actyx: Pond): Emitter => {
  if (emitter === undefined) {
    emitter = {
      actyx,
      stateEvent: (tagArray, machineName, state, stateDesc) => {
        actyx.emit(renderTags(tagArray, machineName, ''), {
          eventType: 'status_changed',
          device: machineName,
          state,
          stateDesc,
        } as StateChangedEvent)
      },

      valueEvent: (tagArray, machineName, name, value) => {
        actyx.emit(renderTags(tagArray, machineName, ''), {
          eventType: 'value_changed',
          device: machineName,
          name,
          value,
        } as ValueChangedEvent)
      },

      generateError: (tagArray, machineName, errorCode, description?) => {
        const errorId = uuid.v1()
        actyx.emit(renderTags(tagArray, machineName, errorId), {
          eventType: 'errorOccurred',
          errorId,
          machineName,
          errorCode,
          description,
        })
      },
    }
  }
  return emitter
}
