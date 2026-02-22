import { useState, useEffect, useRef } from 'react'
import { searchCities } from '../api.js'

export function useCitySearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchCities(query.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timerRef.current)
  }, [query])

  return { query, setQuery, results, loading, setResults }
}
