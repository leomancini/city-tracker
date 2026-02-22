import { useRef, useState } from 'react'
import { useCitySearch } from '../hooks/useCitySearch.js'

function formatLocation(city) {
  const parts = [city.countryName]
  if (city.admin1Name && city.admin1Name !== city.admin1) {
    parts.unshift(city.admin1Name)
  }
  return parts.join(', ')
}

export default function CityTypeahead({ onSelect, existingCityIds = [] }) {
  const { query, setQuery, results, loading, setResults } = useCitySearch()
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  function handleSelect(city) {
    onSelect(city)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="typeahead">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search for a city..."
        className="typeahead-input"
        autoComplete="off"
      />
      {open && (query.length >= 2) && (
        <div className="typeahead-dropdown">
          {loading && <div className="typeahead-item typeahead-loading">Searching...</div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="typeahead-item typeahead-empty">No cities found</div>
          )}
          {results.map(city => {
            const alreadyAdded = existingCityIds.includes(city.id)
            return (
              <button
                key={city.id}
                className={`typeahead-item ${alreadyAdded ? 'typeahead-disabled' : ''}`}
                onClick={() => !alreadyAdded && handleSelect(city)}
                disabled={alreadyAdded}
              >
                <span className="typeahead-city">{city.name}</span>
                <span className="typeahead-location">{formatLocation(city)}</span>
                {alreadyAdded && <span className="typeahead-badge">Added</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
