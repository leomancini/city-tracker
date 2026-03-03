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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const name = username.toLowerCase().trim()
    const existing = users.find(u => u.username === name)
    if (existing) {
      navigate(`/${name}`)
      return
    }
    try {
      await createUser(name)
      navigate(`/${name}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <section className="hero">
        <h1>City Tracker</h1>
        <p>Make lists of cities</p>
      </section>

      <section className="card">
        <form onSubmit={handleSubmit} className="inline-form" role="search">
          <input
            type="search"
            name="city-tracker-search"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="enter a name..."
            pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]"
            title="3-30 chars, lowercase letters, numbers, and hyphens"
            required
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
          <button type="submit" className="btn">Go</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>
    </div>
  )
}
