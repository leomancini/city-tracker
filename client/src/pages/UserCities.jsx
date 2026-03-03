import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserCities, removeCity } from '../api.js'
import CityGroupedList from '../components/CityGroupedList.jsx'

export default function UserCities() {
  const { username } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getUserCities(username)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => { load() }, [load])

  async function handleRemove(cityId) {
    try {
      await removeCity(username, cityId)
      setData(prev => {
        if (!prev) return prev
        const continents = prev.continents.map(cont => ({
          ...cont,
          countries: cont.countries.map(country => ({
            ...country,
            cities: country.cities?.filter(c => c.id !== cityId),
            states: country.states?.map(state => ({
              ...state,
              cities: state.cities.filter(c => c.id !== cityId),
            })).filter(s => s.cities.length > 0),
          })).filter(c => (c.cities?.length || 0) + (c.states?.length || 0) > 0),
        })).filter(cont => cont.countries.length > 0)
        return { ...prev, totalCities: prev.totalCities - 1, continents }
      })
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p className="loading">Loading...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{username}'s Cities</h1>
          <p className="subtitle">{data?.totalCities || 0} cities visited</p>
        </div>
        <div className="page-actions">
          <Link to={`/${username}/add`} className="btn btn-secondary">Add</Link>
          <Link to={`/${username}/import`} className="btn btn-secondary">Import</Link>
        </div>
      </div>
      <CityGroupedList data={data} onRemove={handleRemove} />
    </div>
  )
}
