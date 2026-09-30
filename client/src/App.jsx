import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import UserCities from './pages/UserCities.jsx'
import AddCity from './pages/AddCity.jsx'
import ImportKml from './pages/ImportKml.jsx'
import SyncMyMaps from './pages/SyncMyMaps.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:username" element={<UserCities />} />
          <Route path="/:username/add" element={<AddCity />} />
          <Route path="/:username/import" element={<ImportKml />} />
          <Route path="/:username/sync" element={<SyncMyMaps />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
