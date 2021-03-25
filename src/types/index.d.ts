type TsapSettings = {
  port: number
  host: string
  localTSAP: number
  remoteTSAP: number
  timeout: number
}

declare module 'nodes7' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type OnConnectCallback = (error?: any) => void
  export type TranslationCallback = (key: string) => string
  export type ReadAllCallback<T> = (error: unknown, values: T) => T

  class nodes7 {
    constructor(): PLC
    initiateConnection(settings: TsapSettings, onConnect: OnConnectCallback): void
    setTranslationCB(cb: TranslationCallback): void
    addItems(values: string[]): void
    readAllItems<T>(callback: ReadAllCallback<T>): void
  }
  export = nodes7
}

// export = nodes7
