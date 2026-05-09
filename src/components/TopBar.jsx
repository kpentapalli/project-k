import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TopBar({ active }) {
  const { isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function go(path) {
    setMenuOpen(false)
    navigate(path)
  }

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [menuOpen])

  return (
    <header className="topbar" ref={menuRef}>
      <div className="topbar-logo" onClick={() => go('/dashboard')}>PROJECT K</div>

      {/* Desktop nav */}
      <nav className="topbar-nav topbar-nav-desktop">
        <button className={`nav-btn ${active === 'dashboard' ? 'active' : ''}`} onClick={() => go('/dashboard')}>Dashboard</button>
        <button className={`nav-btn ${active === 'program' ? 'active' : ''}`} onClick={() => go('/program')}>Program</button>
        <button className={`nav-btn ${active === 'about' ? 'active' : ''}`} onClick={() => go('/about')}>About</button>
        {isAdmin && (
          <button className={`nav-btn ${active === 'admin' ? 'active' : ''}`} onClick={() => go('/admin')}>Admin</button>
        )}
        <button className="nav-btn nav-signout" onClick={handleSignOut}>Sign Out</button>
      </nav>

      {/* Mobile hamburger */}
      <button
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(v => !v)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="topbar-dropdown">
          <button className={`dropdown-item ${active === 'dashboard' ? 'active' : ''}`} onClick={() => go('/dashboard')}>Dashboard</button>
          <button className={`dropdown-item ${active === 'program' ? 'active' : ''}`} onClick={() => go('/program')}>Program</button>
          <button className={`dropdown-item ${active === 'about' ? 'active' : ''}`} onClick={() => go('/about')}>About</button>
          {isAdmin && (
            <button className={`dropdown-item ${active === 'admin' ? 'active' : ''}`} onClick={() => go('/admin')}>Admin</button>
          )}
          <button className="dropdown-item dropdown-signout" onClick={handleSignOut}>Sign Out</button>
        </nav>
      )}
    </header>
  )
}
