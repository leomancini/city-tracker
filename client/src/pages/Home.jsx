import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listUsers, createUser } from '../api.js'

export default function Home() {
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    listUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createUser(username.toLowerCase().trim())
      navigate(`/${username.toLowerCase().trim()}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <section className="hero">
        <h1>City Tracker</h1>
        <p>Track the cities you've visited around the world.</p>
      </section>

      <section className="card">
        <h2>Get Started</h2>
        <form onSubmit={handleCreate} className="inline-form">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Choose a username"
            pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]"
            title="3-30 chars, lowercase letters, numbers, and hyphens"
            required
          />
          <button type="submit" className="btn">Create Profile</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2>Existing Profiles</h2>
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p className="empty">No profiles yet. Create one above!</p>
        ) : (
          <div className="user-grid">
            {users.map(user => (
              <Link key={user.username} to={`/${user.username}`} className="user-card">
                <span className="user-card-name">{user.username}</span>
                <span className="user-card-count">{user.cityCount} {user.cityCount === 1 ? 'city' : 'cities'}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
