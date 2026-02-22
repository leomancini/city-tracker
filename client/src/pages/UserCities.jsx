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
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{username}'s Cities</h1>
          <p className="subtitle">{data?.totalCities || 0} cities visited</p>
        </div>
        <div className="page-actions">
          <Link to={`/${username}/add`} className="btn">Add Cities</Link>
          <Link to={`/${username}/import`} className="btn btn-secondary">Import KML</Link>
        </div>
      </div>
      <CityGroupedList data={data} onRemove={handleRemove} />
    </div>
  )
}
