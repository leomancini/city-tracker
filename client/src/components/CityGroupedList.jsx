import { useState } from 'react'
import CityCard from './CityCard.jsx'

function Section({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="section">
      <button className="section-header" onClick={() => setOpen(!open)}>
        <span className="section-arrow">{open ? '▾' : '▸'}</span>
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
          <Section key={continent.code} title={continent.name} count={continentCount}>
            {continent.countries.map(country => (
              <Section key={country.code} title={`${country.name}`} count={countCities(country)}>
                {country.states ? (
                  country.states.map(state => (
                    <Section key={state.code} title={state.name} count={state.cities.length} defaultOpen={false}>
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
