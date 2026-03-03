import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { uploadKml, confirmImport } from '../api.js'

export default function ImportKml() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const results = await uploadKml(username, file)
      setPreview(results)
      const autoSelected = new Set(
        results
          .filter(r => r.matchedCity && r.withinThreshold)
          .map(r => r.matchedCity.id)
      )
      setSelected(autoSelected)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function toggleCity(cityId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(cityId)) next.delete(cityId)
      else next.add(cityId)
      return next
    })
  }

  async function handleConfirm() {
    setConfirming(true)
    setError('')
    try {
      const result = await confirmImport(username, [...selected])
      navigate(`/${username}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Import from KML</h1>
        <Link to={`/${username}`} className="btn btn-secondary">Back to Profile</Link>
      </div>

      <section className="card">
        <input type="file" accept=".kml,.kmz" onChange={handleUpload} disabled={uploading} />
        {uploading && <p>Processing file...</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {preview && (
        <section className="card">
          <h2>Preview ({preview.length} placemarks found)</h2>
          <table className="import-table">
            <thead>
              <tr>
                <th></th>
                <th>KML Name</th>
                <th>Matched City</th>
                <th>Country</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((item, i) => (
                <tr key={i} className={!item.withinThreshold ? 'row-warning' : ''}>
                  <td>
                    {item.matchedCity && (
                      <input
                        type="checkbox"
                        checked={selected.has(item.matchedCity.id)}
                        onChange={() => toggleCity(item.matchedCity.id)}
                      />
                    )}
                  </td>
                  <td>{item.kmlName}</td>
                  <td>{item.matchedCity?.name || 'No match'}</td>
                  <td>{item.matchedCity?.country || '-'}</td>
                  <td>{item.matchedCity ? `${item.distanceKm} km` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="import-actions">
            <button className="btn" onClick={handleConfirm} disabled={confirming || selected.size === 0}>
              {confirming ? 'Importing...' : `Import ${selected.size} Cities`}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
