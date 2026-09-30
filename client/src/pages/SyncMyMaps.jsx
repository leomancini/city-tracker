import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSyncSource, setSyncSource, clearSyncSource, syncFromMyMaps } from '../api.js'

function formatTime(iso) {
  if (!iso) return 'never'
  return new Date(iso).toLocaleString()
}

export default function SyncMyMaps() {
  const { username } = useParams()
  const [source, setSource] = useState(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSyncSource(username)
      .then(data => {
        setSource(data.source)
        setUrl(data.source?.url || '')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [username])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setSaving(true)
    try {
      const data = await setSyncSource(username, url)
      setSource(data.source)
      setUrl(data.source.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSync(dryRun) {
    setError('')
    setResult(null)
    setSyncing(true)
    try {
      const data = await syncFromMyMaps(username, { dryRun })
      setResult(data)
      setSource(data.source)
    } catch (err) {
      setError(err.message)
      getSyncSource(username).then(d => setSource(d.source)).catch(() => {})
    } finally {
      setSyncing(false)
    }
  }

  async function handleUnlink() {
    if (!confirm('Unlink this map? Cities already added will stay.')) return
    setError('')
    setResult(null)
    try {
      await clearSyncSource(username)
      setSource(null)
      setUrl('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p className="loading">Loading...</p>

  return (
    <div>
      <Link to={`/${username}`} className="btn btn-secondary back-btn">Back</Link>
      <div className="page-header">
        <h1>Sync from My Maps</h1>
      </div>

      <section className="card">
        <p className="help-text">
          Paste a Google My Maps link. Every pin on the map is matched to the nearest city and added to this list.
          The map has to be shared as "anyone with the link" for this to work.
        </p>
        <form onSubmit={handleSave} className="inline-form">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.google.com/maps/d/..."
            autoComplete="off"
            spellCheck={false}
            required
          />
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : source ? 'Update' : 'Link'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      {source && (
        <section className="card">
          <h2>Linked map</h2>
          <dl className="sync-meta">
            <dt>Map</dt>
            <dd><a href={source.url} target="_blank" rel="noreferrer">Open in Google My Maps</a></dd>
            <dt>Last synced</dt>
            <dd>{formatTime(source.lastSyncedAt)}</dd>
            {source.lastResult && (
              <>
                <dt>Last result</dt>
                <dd>
                  {source.lastResult.added} added, {source.lastResult.alreadyListed} already listed, {source.lastResult.unmatched} unmatched
                </dd>
              </>
            )}
            {source.lastError && (
              <>
                <dt>Last error</dt>
                <dd className="error">{source.lastError}</dd>
              </>
            )}
          </dl>
          <p className="help-text">The server also re-syncs on its own a few times a day.</p>
          <div className="import-actions">
            <button className="btn" onClick={() => handleSync(false)} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
            <button className="btn btn-secondary" onClick={() => handleSync(true)} disabled={syncing}>
              Preview
            </button>
            <button className="btn btn-secondary" onClick={handleUnlink} disabled={syncing}>
              Unlink
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="card">
          <h2>
            {result.dryRun ? 'Preview' : 'Synced'} ({result.placemarks} pins on the map)
          </h2>
          <p className="subtitle">
            {result.added.length} {result.dryRun ? 'would be added' : 'added'}, {result.alreadyListed.length} already listed, {result.unmatched.length} unmatched
          </p>

          {result.added.length > 0 && (
            <>
              <h3>{result.dryRun ? 'Would add' : 'Added'}</h3>
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Pin</th>
                    <th>City</th>
                    <th>Country</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.added.map(c => (
                    <tr key={c.id}>
                      <td>{c.kmlName}</td>
                      <td>{c.name}</td>
                      <td>{c.country}</td>
                      <td>{c.distanceKm} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {result.unmatched.length > 0 && (
            <>
              <h3>Unmatched pins</h3>
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Pin</th>
                    <th>Nearest city</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.unmatched.map((u, i) => (
                    <tr key={i} className="row-warning">
                      <td>{u.kmlName}</td>
                      <td>{u.nearest ? `${u.nearest.name}, ${u.nearest.country}` : 'None nearby'}</td>
                      <td>{u.nearest ? `${u.nearest.distanceKm} km` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="help-text">Unmatched pins can be added by hand from the Add page.</p>
            </>
          )}
        </section>
      )}
    </div>
  )
}
