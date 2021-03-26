import { Fish, FishId, PendingEmission, Pond, Tag } from '@actyx/pond'

type UndefinedState = {
  type: 'undefined'
  errorId: string
}
type UntouchedState = {
  type: 'untouched'
  errorId: string
  timestampMicros: number
  machineName: string
  errorCode: number
  description?: string
}
type TouchedState = {
  type: 'touched'
  errorId: string
  timestampMicros: number
  machineName: string
  errorCode: number
  description?: string
  openTimestampMicros: number[]
}
type DoneState = {
  type: 'ignored' | 'acknowledged'
  errorId: string
  timestampMicros: number
  machineName: string
  errorCode: number
  description?: string
  openTimestampMicros: number[]
  acknowledgedTimestampMicros: number[]
  ignoredTimestampMicros: number[]
}

export type DefinedState = UntouchedState | TouchedState | DoneState
export type State = UndefinedState | DefinedState

type ErrorOccurredEvent = {
  eventType: 'errorOccurred'
  errorId: string
  machineName: string
  errorCode: number
  description?: string
}
type ErrorOpenedEvent = {
  eventType: 'errorOpened'
  errorId: string
}
type ErrorAcknowledgedEvent = {
  eventType: 'errorAcknowledged'
  errorId: string
}
type ErrorIgnoredEvent = {
  eventType: 'errorIgnored'
  errorId: string
}
type ErrorDescriptionOverwrittenEvent = {
  eventType: 'errorDescriptionOverwritten'
  errorId: string
  description: string
}

export type Event =
  | ErrorOccurredEvent
  | ErrorOpenedEvent
  | ErrorAcknowledgedEvent
  | ErrorIgnoredEvent
  | ErrorDescriptionOverwrittenEvent

type RegistryEvents = ErrorOccurredEvent | ErrorAcknowledgedEvent | ErrorIgnoredEvent

const emitErrorOccurredEvent = (
  actyx: Pond,
  errorId: string,
  machineName: string,
  errorCode: number,
  description?: string,
): PendingEmission =>
  actyx.emit(errorTag.withId(errorId).and(errorOccurredTag), {
    eventType: 'errorOccurred',
    errorId,
    machineName,
    errorCode,
    description,
  })
const emitErrorOpenedEvent = (actyx: Pond, errorId: string): PendingEmission =>
  actyx.emit(errorTag.withId(errorId), {
    eventType: 'errorOpened',
    errorId,
  })
const emitErrorAcknowledgedEvent = (actyx: Pond, errorId: string): PendingEmission =>
  actyx.emit(errorTag.withId(errorId).and(errorDoneTag), {
    eventType: 'errorAcknowledged',
    errorId,
  })
const emitErrorIgnoredEvent = (actyx: Pond, errorId: string): PendingEmission =>
  actyx.emit(errorTag.withId(errorId).and(errorDoneTag), {
    eventType: 'errorIgnored',
    errorId,
  })
const emitErrorDescriptionOverwrittenEvent = (
  actyx: Pond,
  errorId: string,
  description: string,
): PendingEmission =>
  actyx.emit(errorTag.withId(errorId), {
    eventType: 'errorDescriptionOverwritten',
    errorId,
    description,
  })

const errorTag = Tag<Event>('error')
const errorOccurredTag = Tag<ErrorOccurredEvent>('error.Occurred')
const errorDoneTag = Tag<ErrorAcknowledgedEvent | ErrorIgnoredEvent>('error.Done')

export const ErrorFish = {
  tags: {
    errorTag,
    errorOccurredTag,
    errorDoneTag,
  },
  of: (errorId: string): Fish<State, Event> => ({
    fishId: FishId.of('ErrorFish', errorId, 0),
    initialState: {
      type: 'undefined',
      errorId,
    },
    where: errorTag.withId(errorId),
    onEvent: (state, event, { timestampMicros }) => {
      if (event.eventType === 'errorOccurred') {
        return {
          type: 'untouched',
          errorId,
          errorCode: event.errorCode,
          machineName: event.machineName,
          timestampMicros,
          description: event.description,
        }
      }
      if (state.type === 'undefined') {
        return state
      }

      switch (event.eventType) {
        case 'errorOpened':
          if (state.type === 'untouched') {
            return {
              ...state,
              type: 'touched',
              openTimestampMicros: [timestampMicros],
            }
          } else {
            return {
              ...state,
              openTimestampMicros: [...state.openTimestampMicros, timestampMicros],
            }
          }

        case 'errorAcknowledged':
          return {
            ...state,
            type: 'acknowledged',
            openTimestampMicros: state.type !== 'untouched' ? state.openTimestampMicros : [],
            acknowledgedTimestampMicros:
              state.type === 'ignored' || state.type === 'acknowledged'
                ? [...state.acknowledgedTimestampMicros, timestampMicros]
                : [timestampMicros],
            ignoredTimestampMicros:
              state.type === 'ignored' || state.type === 'acknowledged'
                ? state.ignoredTimestampMicros
                : [],
          }
        case 'errorIgnored':
          return {
            ...state,
            type: state.type === 'acknowledged' ? 'acknowledged' : 'ignored',
            openTimestampMicros: state.type !== 'untouched' ? state.openTimestampMicros : [],
            acknowledgedTimestampMicros:
              state.type === 'ignored' || state.type === 'acknowledged'
                ? state.acknowledgedTimestampMicros
                : [],
            ignoredTimestampMicros:
              state.type === 'ignored' || state.type === 'acknowledged'
                ? [...state.ignoredTimestampMicros, timestampMicros]
                : [timestampMicros],
          }
        case 'errorDescriptionOverwritten':
          return {
            ...state,
            description: event.description,
          }
      }
      return state
    },
  }),
  registryOpen: (): Fish<Record<string, boolean>, RegistryEvents> => ({
    fishId: FishId.of('ErrorFishRegistryOpen', 'registry', 0),
    initialState: {},
    where: errorOccurredTag.or(errorDoneTag),
    onEvent: (state, event) => {
      switch (event.eventType) {
        case 'errorOccurred':
          state[event.errorId] = true
          break
        case 'errorAcknowledged':
        case 'errorIgnored':
          delete state[event.errorId]
          break
      }
      return state
    },
  }),
  registry: (): Fish<Record<string, boolean>, RegistryEvents> => ({
    fishId: FishId.of('ErrorFishRegistry', 'registry', 0),
    initialState: {},
    where: errorOccurredTag,
    onEvent: (state, event) => {
      switch (event.eventType) {
        case 'errorOccurred':
          state[event.errorId] = true
          break
      }
      return state
    },
  }),
  emitErrorOccurredEvent,
  emitErrorOpenedEvent,
  emitErrorAcknowledgedEvent,
  emitErrorIgnoredEvent,
  emitErrorDescriptionOverwrittenEvent,
}
