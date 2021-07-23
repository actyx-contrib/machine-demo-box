import { Fish, FishId, Metadata, Tags, Where } from '@actyx/pond'

const fishId = (fish: Fish<any, any>[], version: number) =>
  FishId.of(
    fish.map((f) => f.fishId.entityType).join('-') + '.dbexporter',
    fish.map((f) => f.fishId.name).join('-'),
    parseInt(fish.map((f) => f.fishId.version).join(`${version}`)),
  )

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function mkDbExporterFish<S, E>(
  onStateChanged: (state: [S], metaData: Metadata) => void,
  version: number,
  fish: Fish<S, E>,
): Fish<[S], E>
export function mkDbExporterFish<S1, E1, S2, E2>(
  onStateChanged: (state: [S1, S2], metaData: Metadata) => void,
  version: number,
  fish1: Fish<S1, E1>,
  fish2: Fish<S2, E2>,
): Fish<[S1, S2], E1 | E2>
export function mkDbExporterFish<S1, E1, S2, E2, S3, E3>(
  onStateChanged: (state: [S1, S2, S3], metaData: Metadata) => void,
  version: number,
  fish1: Fish<S1, E1>,
  fish2: Fish<S2, E2>,
  fish3: Fish<S3, E3>,
): Fish<[S1, S2, S3], E1 | E2 | E3>
export function mkDbExporterFish<S1, E1, S2, E2, S3, E3, S4, E4>(
  onStateChanged: (state: [S1, S2, S3], metaData: Metadata) => void,
  version: number,
  fish1: Fish<S1, E1>,
  fish2: Fish<S2, E2>,
  fish3: Fish<S3, E3>,
  fish4: Fish<S4, E4>,
): Fish<[S1, S2, S3, S4], E1 | E2 | E3 | E4>

export function mkDbExporterFish(
  onStateChanged: (state: any[], metaData: Metadata) => void,
  version: number,
  ...fish: Fish<any, any>[]
): Fish<any[], any> {
  return {
    fishId: fishId(fish, version),
    initialState: fish.map((f) => f.initialState),
    where:
      fish.reduce<Where<any> | undefined>(
        (acc, f) => (acc ? acc.or(f.where) : f.where),
        undefined,
      ) || Tags(''),
    onEvent: (state, event, meta) => {
      state = fish.map((f, idx) => f.onEvent(state[idx], event, meta))
      onStateChanged(state, meta)
      return state
    },
  }
}
