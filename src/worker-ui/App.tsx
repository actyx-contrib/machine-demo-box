import { usePond } from '@actyx-contrib/react-pond'
import * as React from 'react'
import { ErrorFish } from '../fish/ErrorFish'
import { ErrorList } from './components/ErrorList'
import { Header } from './components/Header'
import * as uuid from 'uuid'
import { ToggleButtons } from '@actyx/industrial-ui'
import { Button } from './components/Button'

export const App = (): JSX.Element => {
  const [devMode, setDevMode] = React.useState(false)
  const [devModeErrorType, setDevModeErrorType] = React.useState('Error A')
  const [devModeErrorMachine, setDevModeErrorMachine] = React.useState('m1')

  const devModeMockError = () => {
    ErrorFish.emitErrorOccurredEvent(pond, uuid.v1(), devModeErrorMachine, 10, devModeErrorType)
  }

  const pond = usePond()
  React.useEffect(() => {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyD' && e.shiftKey && e.altKey && e.ctrlKey) {
        console.log('Enabling development mode')
        setDevMode(true)
      }
    })
  }, [])
  return (
    <div>
      <Header text="Machine Error Overview" />
      {devMode && (
        <div style={{ display: 'flex' }}>
          <div style={{ margin: '1em' }}>
            <ToggleButtons
              onToggle={(id) => setDevModeErrorMachine(id)}
              items={[
                { id: 'm1', label: 'Machine 1' },
                { id: 'm2', label: 'Machine 2' },
              ]}
              initToggledItemId="third"
            />
          </div>

          <div style={{ margin: '1em' }}>
            <ToggleButtons
              onToggle={(id) => setDevModeErrorType(id)}
              items={[
                { id: 'Error A', label: 'Error A' },
                { id: 'Error B', label: 'Error B' },
              ]}
              initToggledItemId="third"
            />
          </div>

          <div style={{ margin: '1em' }}>
            <Button variant="raised" color="primary" onClick={devModeMockError} text="send" />
          </div>
        </div>
      )}
      <div style={{ padding: '24px 24px' }}>
        <ErrorList />
      </div>
    </div>
  )
}
