import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Pond } from '@actyx-contrib/react-pond'
import { App } from './App'

const onError = () => {
  setTimeout(() => location.reload(), 2500)
}

ReactDOM.render(
  <React.StrictMode>
    <Pond
      manifest={{
        appId: 'com.example.demobox.worker-ui',
        displayName: 'Worker UI',
        version: '1.0.0',
      }}
      loadComponent={<div>Connecting to ActyxOS</div>}
      onError={onError}
      connectionOpts={{ onConnectionLost: onError }}
    >
      <App />
    </Pond>
  </React.StrictMode>,
  document.getElementById('root'),
)
