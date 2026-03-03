import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { addCity, getUserCities } from '../api.js'
import CityTypeahead from '../components/CityTypeahead.jsx'

export default function AddCity() {
  const { username } = useParams()
  const [existingIds, setExistingIds] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getUserCities(username).then(data => {
      const ids = []
      for (const cont of data.continents || []) {
        for (const country of cont.countries || []) {
          if (country.states) {
            for (const state of country.states) {
              for (const city of state.cities) ids.push(city.id)
            }
          }
          if (country.cities) {
            for (const city of country.cities) ids.push(city.id)
          }
        }
      }
      setExistingIds(ids)
    }).catch(() => {})
  }, [username])

  async function handleSelect(city) {
    setError('')
    try {
      await addCity(username, city.id)
      setExistingIds(prev => [...prev, city.id])
      setRecentlyAdded(prev => [city, ...prev])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <Link to={`/${username}`} className="btn btn-secondary back-btn">Back</Link>
      <div className="page-header">
        <h1>Add City</h1>
      </div>

      <section className="card">
        <CityTypeahead onSelect={handleSelect} existingCityIds={existingIds} />
        {error && <p className="error">{error}</p>}
      </section>

      {recentlyAdded.length > 0 && (
        <section className="card">
          <h3>Just Added</h3>
          <ul className="recent-list">
            {recentlyAdded.map(city => (
              <li key={city.id}>{city.name}, {city.countryName}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
