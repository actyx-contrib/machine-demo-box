import { usePond } from '@actyx-contrib/react-pond'
import * as React from 'react'
import { ErrorFish } from '../fish/ErrorFish'
import { Button } from './components/Button'
import { ErrorList } from './components/ErrorList'
import { Header } from './components/Header'
import * as uuid from 'uuid'

export const App = (): JSX.Element => {
  const [devMode, setDevMode] = React.useState(false)
  const pond = usePond()
  React.useEffect(() => {
    document.addEventListener('keydown', (e) => {
      console.log(e)
      if (e.key === 'D' && e.shiftKey && e.altKey) {
        setDevMode(true)
      }
    })
  }, [])
  return (
    <div>
      <Header text="Machine Error Overview" />
      {devMode && (
        <Button
          variant="flat"
          color="primary"
          onClick={() => ErrorFish.emitErrorOccurredEvent(pond, uuid.v1(), 'm1', 10, 'Error A')}
          text="send event"
        />
      )}
      <div style={{ padding: '24px 24px' }}>
        <ErrorList />
      </div>
    </div>
  )
}
