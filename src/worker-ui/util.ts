export const toDate = (tsMicros: number): string => {
  const ts = new Date(Math.floor(tsMicros / 1e3))
  return `${ts.getFullYear()}-${
    ts.getMonth() + 1
  }-${ts.getDate()} ${ts.getHours()}:${ts.getMinutes()}:${ts.getSeconds()}`
}
