export const appSettings = <S>(defaultSettings: S): S => {
  try {
    if (process.env.APP_SETTINGS) {
      return JSON.parse(process.env.APP_SETTINGS) as S
    }
  } catch (e) {
    console.error('failed to parse APP_SETTINGS', process.env)
  }
  return defaultSettings
}
