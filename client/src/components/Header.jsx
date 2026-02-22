import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">City Tracker</Link>
      </div>
    </header>
  )
}
