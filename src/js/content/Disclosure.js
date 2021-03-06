import React, { Component, PropTypes } from 'react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { nest } from 'd3-collection'
import { css } from 'glamor'
import { getLocale, t, isRts  } from '../utils'

const h1 = css({
  color: 'black',
  marginBottom: '0px',
  marginTop: '3px'
})
const h2 = css({
  marginBottom: '10px'
})
const pullRight = css({
  float: 'right'
})
const ellipsisNames = css({
  display: 'block',
  width: '100%',
  fontStyle: 'italic',
  fontSize: '0.8em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})
const rtsStyle = css({
  maxWidth: 1000,
  margin: '0 auto',
  backgroundClip: 'padding-box',
  padding: '1.25rem',
  paddingBottom: '1.5625rem',
  marginBottom: '1.5625rem',
  border: '1px solid #dedede',
  borderLeft: '4px solid #f45050',
  background: '#fbfbfb',
  '& ul': { paddingLeft: '25px' },
  '& ul li': { listStyle: 'disc' }
})

function ascending (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN
}

class Connections extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }
  render () {
    const {data} = this.props
    const moreKey = '$more$'
    let groups = nest()
      .key(connection => connection.group || moreKey)
      .entries(data)

    let moreGroup = groups.filter(g => g.key === moreKey)[0]

    groups = groups.filter(g => g.key !== moreKey)
    groups.sort((a, b) => ascending(a.values.length, b.values.length))

    const moreGroups = groups.slice(5)
    groups = groups.slice(0, 5)

    if (moreGroups && moreGroups.length) {
      if (!moreGroup) {
        moreGroup = {
          key: moreKey,
          values: []
        }
      }
      moreGroups.forEach(({values}) => {
        moreGroup.values = moreGroup.values.concat(values)
      })
    }
    if (moreGroup) {
      groups.push(moreGroup)
    }

    return (
      <ul>
        {groups.map(({key, values}, i) => {
          const isToggable = values.length !== 1
          const isOpen = !!this.state[key] || !isToggable
          const name = (
            <span>
              {values.length}
              &nbsp;
              {key === moreKey ? t(`Connections/more/${values.length === 1 ? 'singular' : 'plural'}`) : key}
            </span>
          )
          return (
            <li key={i}>
              {isToggable && <a style={{cursor: 'pointer'}} onClick={(e) => { e.preventDefault(); this.setState({[key]: !isOpen}) }}>
                {name}
                {!isOpen && <br />}
                {!isOpen && <span {...ellipsisNames}>{values.map(value => value.to.name).join(', ')}</span>}
              </a>}
              {!isToggable && name}
              {isOpen && (<ul>
                {values.map((value, i) => <li key={i}>{value.to.name}</li>)}
              </ul>)}
            </li>
          )
        })}
      </ul>
    )
  }
}

const Parliamentarian = ({data}) => {
  if (data.loading) {
    return <span>{t('loading')}</span>
  }
  if (data.error) {
    return <span>{data.error.toString()}</span>
  }

  const {
    id, name, firstName, lastName,
    portrait, council, gender, partyMembership, canton,
    connections
  } = data.getParliamentarian

  return (
    <div className={`${isRts() ? rtsStyle : 'alert alert-info'}`}>
      <img src={portrait} className={`${pullRight}`} />
      <h1 className={`${h1}`}>{name}</h1>
      <h2 className={`${h2}`}>{t(`Detail/${council}-${gender}`)} {partyMembership ? partyMembership.party.abbr : ''} {canton}</h2>
      <p>{t('Detail/directConnections')}</p>
      <Connections data={connections.filter(connection => !connection.via)} />
      <p>
        <a target='_blank' href={`https://lobbywatch.ch/de/daten/parlamentarier/${id.replace('Parliamentarian-', '')}/${firstName}%20${lastName}`}>
          {t('Detail/link')}
        </a>
      </p>
    </div>
  )
}

const parliamentarianQuery = gql`query getParliamentarian($locale: Locale!, $id: ID!) {
  getParliamentarian(locale: $locale, id: $id) {
    id
    name
    firstName
    lastName
    portrait
    council
    gender
    partyMembership {
      party {
        abbr
      }
    }
    canton
    connections {
      group
      function
      via {
        ... on Guest {
          name
        }
      }
      to {
        ... on Organisation {
          name
        }
      }
    }
  }
}`
const ParliamentarianFromId = graphql(parliamentarianQuery)(Parliamentarian)

const Guest = ({data}) => {
  if (data.loading) {
    return <span>{t('loading')}</span>
  }
  if (data.error) {
    return <span>{data.error.toString()}</span>
  }

  const {
    id, name, firstName, lastName,
    function: func, parliamentarian,
    connections
  } = data.getGuest

  return (
    <div className='alert alert-info'>
      <h1 className={`${h1}`}>{name}</h1>
      <h2 className={`${h2}`}>{func} {t('Detail/invited-by')} {parliamentarian}</h2>
      <p>{t('Detail/directConnections')}</p>
      <Connections data={connections.filter(connection => !connection.via)} />
      <p>
        <a target='_blank' href={`https://lobbywatch.ch/${getLocale()}/daten/parlamentarier/${id.replace('Parliamentarian-', '')}/${firstName}%20${lastName}`}>
          {t('Detail/link')}
        </a>
      </p>
    </div>
  )
}
const guestQuery = gql`query getGuest($locale: Locale!, $id: ID!) {
  getGuest(locale: $locale, id: $id) {
    id
    name
    firstName
    lastName
    parliamentarian
    function
    connections {
      group
      function
      to {
        ... on Organisation {
          name
        }
      }
    }
  }
}`
const GuestFromId = graphql(guestQuery)(Guest)

const List = ({parliamentarianIds, guestIds}) => {
  const hasDisclosures = parliamentarianIds.length || guestIds.length
  return (
    <div>
      {!hasDisclosures && <p>{t('Disclosure/none')}</p>}
      {!!parliamentarianIds.length && <h2>{t('List/parliamentarians')}</h2>}
      {parliamentarianIds.map(id => (
        <ParliamentarianFromId key={id} id={id} locale={getLocale()} />
      ))}
      {!!guestIds.length && <h2>{t('List/guests')}</h2>}
      {guestIds.map(id => (
        <GuestFromId key={id} id={id} locale={getLocale()} />
      ))}
    </div>
  )
}

List.propTypes = {
  parliamentarianIds: PropTypes.arrayOf(PropTypes.string)
}

export default List
