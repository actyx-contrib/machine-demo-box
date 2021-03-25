import * as React from 'react'
import * as UI from '@actyx/industrial-ui'
import { Button } from './Button'
import { useFishFn, usePond } from '@actyx-contrib/react-pond'
import { ErrorFish } from '../../fish/ErrorFish'
import { LoadingBar } from '@actyx/industrial-ui'
import { toDate } from '../util'
import { Card } from './Card'
import { TextArea } from './TextArea'

type Props = {
  errorId: string
  closed: () => void
}

export const DetailView = ({ errorId, closed }: Props): JSX.Element => {
  const errorFish = useFishFn(ErrorFish.of, errorId)
  const [description, setDescription] = React.useState('')
  const pond = usePond()
  React.useEffect(() => {
    errorFish &&
      errorFish.state.type !== 'undefined' &&
      setDescription(errorFish.state.description || '')
  }, [errorFish && errorFish.state.errorId])

  React.useEffect(() => {
    errorFish &&
      errorFish.state.type === 'untouched' &&
      ErrorFish.emitErrorOpenedEvent(pond, errorId)
  }, [errorFish && errorFish.state.errorId])

  if (!errorFish) {
    return (
      <UI.Card
        color="neutral"
        raised
        header={<UI.Typography variant="distance">Error Details</UI.Typography>}
        content={<LoadingBar />}
      />
    )
  }
  if (errorFish.state.type === 'undefined') {
    return (
      <UI.Card
        color="neutral"
        raised
        header={<UI.Typography variant="distance">Error never happened</UI.Typography>}
        content={<LoadingBar />}
      />
    )
  }

  const error = errorFish.state
  const { errorCode, timestampMicros, machineName } = error

  const updateDescription = () => {
    ErrorFish.emitErrorDescriptionOverwrittenEvent(pond, errorId, description)
  }
  const ignoreError = () => {
    ErrorFish.emitErrorIgnoredEvent(pond, errorId)
    closed()
  }
  const acknowledgeError = () => {
    ErrorFish.emitErrorAcknowledgedEvent(pond, errorId)
    closed()
  }

  return (
    <Card
      color="neutral"
      raised
      header={<UI.Typography variant="distance">Error Details</UI.Typography>}
      content={
        <div style={{ margin: '12px 24px' }}>
          <div style={{ margin: '12px 24px', display: 'flex' }}>
            <div style={{ flex: '1' }}>
              <UI.Typography variant="subtext">Time</UI.Typography>
            </div>{' '}
            <div>{toDate(timestampMicros)}</div>
          </div>
          <div style={{ margin: '12px 24px', display: 'flex' }}>
            <div style={{ flex: '1' }}>
              <UI.Typography variant="subtext">Machine</UI.Typography>
            </div>{' '}
            <div>{machineName}</div>
          </div>
          <div style={{ margin: '12px 24px', display: 'flex' }}>
            <div style={{ flex: '1' }}>
              <UI.Typography variant="subtext">Error code</UI.Typography>
            </div>{' '}
            <div>{errorCode}</div>
          </div>
          {error.type !== 'untouched' && (
            <div style={{ margin: '12px 24px', display: 'flex' }}>
              <div style={{ flex: '1' }}>
                <UI.Typography variant="subtext">Opened At</UI.Typography>
              </div>
              <div>{error.openTimestampMicros.map(toDate).join(', ')}</div>
            </div>
          )}

          <div style={{ margin: '12px 24px' }}>
            <UI.Typography variant="subtext">Description:</UI.Typography>
          </div>
          <div style={{ margin: '12px 24px' }}>
            <TextArea
              fullWidth
              value={description}
              onChange={({ target }) => setDescription(target.value)}
            />
          </div>
          <div style={{ margin: '12px 24px', display: 'flex', flexDirection: 'row-reverse' }}>
            <Button
              color="primary"
              variant="raised"
              onClick={updateDescription}
              text="Update description"
            />
          </div>
          <div style={{ margin: '96px 24px 12px' }}>
            <UI.Typography variant="subtext" textTransform="uppercase">
              Reaction:
            </UI.Typography>
          </div>
          <div style={{ margin: '12px 24px', display: 'flex', flexDirection: 'row' }}>
            <Button color="yellow" variant="raised" onClick={ignoreError} text="Ignore" />
            <div style={{ flex: '1' }}></div>
            <Button color="green" variant="raised" onClick={acknowledgeError} text="Acknowledge" />
          </div>
        </div>
      }
    />
  )
}
