import { distinctUntilChanged, map, tap } from 'rxjs/operators'
import { OpcuaStreams, Value, Values } from './types'

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
