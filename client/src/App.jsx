import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import UserCities from './pages/UserCities.jsx'
import AddCity from './pages/AddCity.jsx'
import ImportKml from './pages/ImportKml.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:username" element={<UserCities />} />
          <Route path="/:username/add" element={<AddCity />} />
          <Route path="/:username/import" element={<ImportKml />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
