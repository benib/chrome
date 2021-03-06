import React, { PropTypes } from 'react'
import { css } from 'glamor'
import { t, isRts } from '../utils'

const Logo = ({size, style, className}) => (
  <svg width={size} height={size} style={style} className={className} viewBox='0 0 74 74'>
    <title>
      Logo
    </title>
    <g>
      <circle fill='#74D7FF' cx='37' cy='37' r='37' />
      <circle fill='#1f2532' cx='37' cy='37' r='20' />
      <circle fill='#fff' cx='45' cy='29' r='5' />
    </g>
  </svg>
)

Logo.defaultProps = {
  size: 74
}
Logo.propTypes = {
  size: PropTypes.number.isRequired,
  style: PropTypes.object
}

const style = css({
  borderLeft: '2px solid #0077D7',
  paddingLeft: 10
})

const rtsStyle = css({
  '& ul': { paddingLeft: '25px' },
  '& ul li': { listStyle: 'disc' }
})

const Container = ({children}) => (
  <div {...style} {...rtsStyle} className={`${isRts() ? 'border' : ''}`}>
    <h1><Logo size={20} /> {t('title')}</h1>
    <div>
      {children}
    </div>
  </div>
)

export default Container
