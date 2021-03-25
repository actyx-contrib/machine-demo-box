import { TouchRipple, MUIcon, Typography } from '@actyx/industrial-ui'
import { theme } from '@actyx/industrial-ui/lib/theme'
import classNames from 'classnames'
import * as React from 'react'
import injectSheet, { StyleSheet, WithStyles } from 'react-jss'
import { compose, setDisplayName } from 'recompose'

export type ButtonVariant = 'flat' | 'raised'

export type ButtonColor =
  | 'primary'
  | 'grey'
  | 'neutral'
  | 'transparent'
  | 'green'
  | 'orange'
  | 'yellow'
  | 'red'

type CompProps = Readonly<{
  className?: string
  variant: 'flat' | 'raised'
  color: 'primary' | 'grey' | 'neutral' | 'transparent' | 'green' | 'orange' | 'yellow' | 'red'
  icon?: string
  text?: React.ReactNode
  disabled?: boolean
  fullWidth?: boolean
  noWrap?: boolean
  centered?: boolean
  onClick: (ev: React.MouseEvent<HTMLElement>) => void
}>

type Props = WithStyles<ClassKey> & CompProps

const ButtonComp = ({
  classes,
  variant,
  color,
  icon,
  text,
  disabled,
  fullWidth,
  onClick,
  className,
  noWrap,
  centered,
}: Props) => (
  <TouchRipple
    disabled={!!disabled}
    onClick={onClick}
    className={classNames(
      classes.root,
      {
        [classes.shadow]: variant !== 'flat',
        [classes.fullWidth]: fullWidth,
        [classes.disabled]: disabled,
      },
      className,
    )}
  >
    <div className={classNames(classes[variant], classes[color], { [classes.centered]: centered })}>
      {icon && (
        <div className={classes.icon}>
          <MUIcon type={icon} fontSize={40} />
        </div>
      )}
      {text && (
        <div className={icon ? classes.textIcon : classes.text}>
          <Typography noWrap={noWrap} variant="standard" textTransform="uppercase" bold>
            {text}
          </Typography>
        </div>
      )}
    </div>
  </TouchRipple>
)

type ClassKey =
  | 'root'
  | 'flat'
  | 'raised'
  | 'text'
  | 'textIcon'
  | 'shadow'
  | 'icon'
  | 'neutral'
  | 'primary'
  | 'grey'
  | 'transparent'
  | 'green'
  | 'orange'
  | 'yellow'
  | 'red'
  | 'fullWidth'
  | 'disabled'
  | 'centered'

const styles: StyleSheet<ClassKey> = {
  root: {
    display: 'inline-block',
    height: 60,
  },
  icon: {
    width: 60,
    height: 60,
    lineHeight: 0,
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flat: {
    height: '100%',
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
  },
  raised: {
    height: '100%',
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
    borderRadius: 4,
  },
  centered: {
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2f5883',
    color: theme.palette.primary.contrastText,
    '& span': {
      color: theme.palette.primary.contrastText,
    },
  },
  grey: {
    backgroundColor: theme.palette.grey[600],
    color: theme.palette.primary.contrastText,
    '& span': {
      color: theme.palette.primary.contrastText,
    },
  },
  neutral: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[900],
  },
  green: {
    backgroundColor: '#3e9042',
    color: theme.palette.primary.contrastText,
    '& span': {
      color: theme.palette.primary.contrastText,
    },
  },
  orange: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.primary.contrastText,
    '& span': {
      color: theme.palette.primary.contrastText,
    },
  },
  yellow: {
    backgroundColor: theme.palette.acknowledge.dark,
    color: theme.palette.primary.contrastText,
    '& span': {
      color: theme.palette.primary.contrastText,
    },
  },
  red: {
    backgroundColor: '#a60808',
    color: theme.palette.primary.contrastText,
    '& span': {
      color: theme.palette.primary.contrastText,
    },
  },
  transparent: {},
  shadow: {
    boxShadow: theme.shadow.xs,
    borderRadius: 4,
  },
  text: {
    paddingRight: 24,
    paddingLeft: 24,
  },
  textIcon: {
    paddingRight: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    filter: 'contrast(60%)',
  },
}

/**
 * Button provides the user with a simple way to take and action or make choices with a single tap.
 * It is typically placed throughout your UI layout, as within Cards and Dialogs for instance.
 */
export const Button = compose<Props, CompProps>(
  setDisplayName('Button'),
  injectSheet(styles),
)(ButtonComp)
