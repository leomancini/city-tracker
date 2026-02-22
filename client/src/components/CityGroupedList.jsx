import { useState } from 'react'
import CityCard from './CityCard.jsx'

function countryFlag(code) {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

function Section({ title, flag, count, children, defaultOpen = false, depth = 0 }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`section section-depth-${depth}`}>
      <button className="section-header" onClick={() => setOpen(!open)}>
        <span className={`section-arrow${open ? ' section-arrow-open' : ''}`} />
        {flag && <span className="section-flag">{flag}</span>}
        <span className="section-title">{title}</span>
        <span className="section-count">{count}</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  )
}

function countCities(country) {
  if (country.states) {
    return country.states.reduce((sum, s) => sum + s.cities.length, 0)
  }
  return country.cities?.length || 0
}

export default function CityGroupedList({ data, onRemove }) {
  if (!data || data.totalCities === 0) {
    return <p className="empty">No cities yet. Start adding some!</p>
  }

  return (
    <div className="grouped-list">
      {data.continents.map(continent => {
        const continentCount = continent.countries.reduce((sum, c) => sum + countCities(c), 0)
        return (
          <Section key={continent.code} title={continent.name} count={continentCount} depth={0}>
            {continent.countries.map(country => (
              <Section key={country.code} title={country.name} flag={countryFlag(country.code)} count={countCities(country)} depth={1}>
                {country.states ? (
                  country.states.map(state => (
                    <Section key={state.code} title={state.name} count={state.cities.length} depth={2}>
                      {state.cities.map(city => (
                        <CityCard key={city.id} city={city} onRemove={onRemove} />
                      ))}
                    </Section>
                  ))
                ) : (
                  country.cities?.map(city => (
                    <CityCard key={city.id} city={city} onRemove={onRemove} />
                  ))
                )}
              </Section>
            ))}
          </Section>
        )
      })}
    </div>
  )
}
