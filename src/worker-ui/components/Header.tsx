import React from 'react'
import { Typography } from '@actyx/industrial-ui'
import { Logo } from '../assets/logo'

type Props = {
  text: string
}

export const Header = ({ text }: Props): JSX.Element => {
  return (
    <div style={{ display: 'flex', backgroundColor: '#2f5883' }}>
      <div style={{ padding: '36px 48px', flex: '1' }}>
        <Typography color="#fafaff" variant="distance" textTransform="uppercase">
          {text}
        </Typography>
      </div>
      <div style={{ padding: '0px 24px' }}>
        <Logo />
      </div>
    </div>
  )
}
