import React from 'react'
import { useRegistryFish } from '@actyx-contrib/react-pond'
import { ErrorFish, State, DefinedState } from '../../fish/ErrorFish'
import * as UI from '@actyx/industrial-ui'
import './errorList.css'
import { DetailView } from './DetailView'
import { toDate } from '../util'

const isActive = (error: State): error is DefinedState => error.type !== 'undefined'

export const ErrorList = (): JSX.Element => {
  const [rowSelected, setRowSelected] = React.useState('')
  const errorList = useRegistryFish(ErrorFish.registryOpen(), Object.keys, ErrorFish.of)

  const titles = ['Timestamp', 'Machine', 'Error Code', 'Description']

  if (!errorList) {
    return <div>loading...</div>
  }

  const createTableCell = (children: React.ReactNode, header: boolean, idx: number) => (
    <UI.TableCell key={idx}>
      <UI.Typography variant="standard" textTransform={header ? 'uppercase' : undefined}>
        {children}
      </UI.Typography>
    </UI.TableCell>
  )

  return (
    <div className="errorLayout">
      <div style={{ margin: '24px 24px', flex: '3' }}>
        <UI.Table>
          <UI.TableHeader>
            <UI.TableRow>{titles.map((cell, idx) => createTableCell(cell, true, idx))}</UI.TableRow>
          </UI.TableHeader>
          <UI.TableBody>
            {errorList
              .map((s) => s.state)
              .filter(isActive)
              .map((row) => (
                <UI.TableRow
                  key={row.errorId}
                  active={row.errorId === rowSelected}
                  onSelect={() => setRowSelected(row.errorId)}
                >
                  {[
                    toDate(row.timestampMicros),
                    row.machineName,
                    row.errorCode,
                    row.description,
                  ].map((cell, idx) => createTableCell(cell, false, idx))}
                </UI.TableRow>
              ))}
          </UI.TableBody>
        </UI.Table>
        {/* <div style={{border: 'solid 1px #444689', borderRadius: 4}}>
          <div style={{display: 'flex'}}>
              <div style={{margin: '12px 24px'}}>Timestamp</div>
              <div style={{margin: '12px 24px'}}>Machine</div>
              <div style={{margin: '12px 24px'}}>Error Code</div>
          </div>
          <div>{
            errorList.state.map(entry => <UI.TableEntry entry={entry}/>)
          }
          </div>
        </div> */}
      </div>
      <div style={{ margin: '24px 24px', flex: '0 1 512px' }}>
        {rowSelected && <DetailView errorId={rowSelected} closed={() => setRowSelected('')} />}
      </div>
    </div>
  )
}
