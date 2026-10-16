import { List, MagnifyingGlass, Bell, CaretDown, User, SignOut } from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserData } from '../../utils/auth'
import { useLogout } from '../../hooks/useAuth'
import { getUserDisplayName, getUserRoleName, type User as UserType } from '../../types'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

interface Props { onMenuClick: () => void }

const Topbar = ({ onMenuClick }: Props) => {
  const logout   = useLogout()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const user = getUserData<UserType>()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = user ? getUserDisplayName(user) : 'User'
  const roleName    = user ? getUserRoleName(user)    : 'Officer'
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const firstName   = displayName.includes('@')
    ? displayName.split('@')[0]
    : displayName.split(' ')[0]

  return (
    <header style={{
      height: 58, background: '#fff',
      borderBottom: '1px solid #f0f2f5',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
      gap: 16,
    }}>

      {/* Left: hamburger (mobile) + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 380 }}>
        <button onClick={onMenuClick} className="lg:hidden"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex' }}>
          <List size={20} />
        </button>

        {/* Search bar */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flex: 1, padding: '8px 14px',
          background: '#f7f8fa', border: '1px solid #eef0f3',
          borderRadius: 10, cursor: 'text',
        }}>
          <MagnifyingGlass size={15} color="#9ca3af" />
          <span style={{ fontSize: 13, color: '#9ca3af', userSelect: 'none' }}>
            Search budgets, reports, entries…
          </span>
        </label>
      </div>

      {/* Right: notifications + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Bell */}
        <button style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: 8, borderRadius: 8, color: '#9ca3af',
          display: 'flex', transition: 'all 0.12s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f7f8fa'; (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, borderRadius: '50%',
            background: '#f59e0b', border: '1.5px solid #fff',
          }} />
        </button>

        <div style={{ width: 1, height: 22, background: '#f0f2f5' }} />

        {/* User section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Greeting text — hidden on small screens */}
          <div className="hidden md:block" style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3 }}>
              {greeting()}, {firstName}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, lineHeight: 1.3 }}>{roleName}</p>
          </div>

          {/* Avatar + dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 10,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f7f8fa'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#0d2137',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{initials}</span>
              </div>
              <CaretDown size={12} color="#9ca3af" />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 230, background: '#fff',
                borderRadius: 12, border: '1px solid #f0f2f5',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
                overflow: 'hidden', zIndex: 50,
              }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f7f8fa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0d2137', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{initials}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>{displayName}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  {[
                    { label: 'My Profile', icon: User, action: () => { setDropdownOpen(false); navigate('/dashboard/profile') } },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f7f8fa'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
                      onClick={action}
                    >
                      <Icon size={15} color="#6b7280" />
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ height: 1, background: '#f7f8fa' }} />

                <div style={{ padding: '6px 0' }}>
                  <button
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
                    onClick={() => { setDropdownOpen(false); logout() }}
                  >
                    <SignOut size={15} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
