import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Pond } from '@actyx-contrib/react-pond'
import { App } from './App'

type Props = {
  error: string | undefined
}

export const Loading = ({ error }: Props): JSX.Element => {
  const [time, setTime] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => setTime((time) => time + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* show the user that the connection attempt is ongoing */}
      <p>Connecting to Actyx … (since {time}sec)</p>
      {
        /* showing the error is essential for useful failure response */
        error ? (
          <p>
            Error: <pre>{error}</pre>
            <br />
            Is Actyx running?
          </p>
        ) : undefined
      }
    </div>
  )
}

export const Root = (): JSX.Element => {
  const [error, setError] = React.useState<string | undefined>()
  const onError = (e: unknown) => {
    setError(JSON.stringify(e, undefined, 2))
    setTimeout(() => location.reload(), 2500)
  }
  return (
    <React.StrictMode>
      <Pond
        manifest={{
          appId: 'com.example.demobox.worker-ui',
          displayName: 'Worker UI',
          version: '1.0.0',
        }}
        loadComponent={<Loading error={error} />}
        onError={onError}
        connectionOpts={{ onConnectionLost: () => onError('Connection lost') }}
      >
        <App />
      </Pond>
    </React.StrictMode>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById('root'),
)
