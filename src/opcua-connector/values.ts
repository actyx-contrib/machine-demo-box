import { distinctUntilChanged, map, tap } from 'rxjs/operators'
import { OpcuaStreams, Value, Values } from './types'

/** helper to transalte a value into the configured output */
const toValue =
  (settings: Value) =>
  (value: unknown): number => {
    let nr = typeof value === 'string' || typeof value === 'number' ? +value : 0

    if (settings.decimal !== undefined || settings.scale !== undefined) {
      if (settings.scale !== undefined) {
        nr *= settings.scale
      }
      if (settings.decimal !== undefined) {
        nr = +nr.toFixed(settings.decimal)
      }
    }

    return nr
  }

/**
 * Listen to the configured values and emit an event if one value changed.
 *
 * All settings could be found in the values configuration
 *
 * @param streams stream of all opcua values
 * @param values configuration of the value stream from the settings
 * @param emit callback when a value event needs to be emitted
 */
export const executeValueEmitter = (
  streams: OpcuaStreams,
  values: Values,
  emit: (name: string, value: number) => void,
): void =>
  Object.entries(values).forEach(([name, settings]) => {
    if (streams.hasOwnProperty(name)) {
      const key = name as keyof OpcuaStreams
      streams[key]
        .pipe(
          map((v) => v.value),
          map(toValue(settings)),
          distinctUntilChanged((prev, cur) => settings.distinct && prev === cur),
          tap((v) => emit(settings.name, v)),
        )
        .subscribe()
    }
  })
