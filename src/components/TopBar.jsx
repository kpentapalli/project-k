import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TopBar({ active }) {
  const { isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-logo" onClick={() => navigate('/dashboard')}>PROJECT K</div>
      <nav className="topbar-nav">
        <button
          className={`nav-btn ${active === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-btn ${active === 'program' ? 'active' : ''}`}
          onClick={() => navigate('/program')}
        >
          Program
        </button>
        {isAdmin && (
          <button
            className={`nav-btn ${active === 'admin' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            Admin
          </button>
        )}
        <button className="nav-btn nav-signout" onClick={handleSignOut}>Sign Out</button>
      </nav>
    </header>
  )
}
