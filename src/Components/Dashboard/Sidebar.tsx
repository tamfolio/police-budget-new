import { NavLink, useLocation } from 'react-router-dom'
import {
  SquaresFour, ArrowDown, Wallet, MapTrifold, ClipboardText, Tag,
  ChartBar, ArrowsLeftRight, Receipt, Buildings, UsersThree,
  Notepad, X, CaretDown, CaretRight, SignOut, Coins,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { getUserData } from '../../utils/auth'
import { getUserDisplayName, getUserRoleName, type User } from '../../types'
import { useLogout } from '../../hooks/useAuth'

interface NavItem {
  label: string
  to?: string
  icon: React.ElementType
  children?: { label: string; to: string }[]
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    items: [
      { label: 'Overview', to: '/dashboard', icon: SquaresFour },
    ],
  },
  {
    section: 'Budget',
    items: [
      { label: 'Fund Inflows',     to: '/dashboard/fund-inflows',     icon: ArrowDown },
      { label: 'AIE',              to: '/dashboard/aie',              icon: Wallet },
      { label: 'Distributions',    to: '/dashboard/distributions',    icon: MapTrifold },
      { label: 'Budget Proposals', to: '/dashboard/budget-proposals', icon: ClipboardText },
      { label: 'Budget Codes',     to: '/dashboard/budget-codes',     icon: Tag },
      { label: 'Capital Budget',   to: '/dashboard/capital-budget',   icon: Coins },
    ],
  },
  {
    section: 'Analysis',
    items: [
      { label: 'Reports',      to: '/dashboard/reports',      icon: ChartBar },
      { label: 'Comparisons',  to: '/dashboard/comparisons',  icon: ArrowsLeftRight },
      { label: 'Expenditures', to: '/dashboard/expenditures', icon: Receipt },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Departments', to: '/dashboard/departments', icon: Buildings },
      {
        label: 'Users & Roles',
        icon: UsersThree,
        children: [
          { label: 'Users', to: '/dashboard/admin/users' },
          { label: 'Roles', to: '/dashboard/admin/roles' },
        ],
      },
      { label: 'Audit Trail', to: '/dashboard/audit', icon: Notepad },
    ],
  },
]

interface Props { open: boolean; onClose: () => void }

const Sidebar = ({ open, onClose }: Props) => {
  const location = useLocation()
  const [expanded, setExpanded] = useState<string[]>([])
  const logout = useLogout()
  const user        = getUserData<User>()
  const displayName = user ? getUserDisplayName(user) : 'User'
  const roleName    = user ? getUserRoleName(user)    : 'Officer'
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const toggle = (label: string) =>
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])

  const isChildActive = (children: { to: string }[]) =>
    children.some(c => location.pathname === c.to)

  const itemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#0d2137' : '#6b7280',
    background: isActive ? '#eef1f8' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.12s',
    cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left',
  })

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col w-[220px] transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#fff', borderRight: '1px solid #f0f2f5' }}
      >
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/npf-logo.png" alt="NPF" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: '#0d2137', margin: 0, lineHeight: 1.3 }}>Nigeria Police Force</p>
              <p style={{ fontSize: 9.5, color: '#9ca3af', margin: 0, lineHeight: 1.3 }}>Budget System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ height: 1, background: '#f0f2f5', margin: '0 16px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {NAV.map(({ section, items }, si) => (
            <div key={section} style={{ marginBottom: 2 }}>
              {si > 0 && <div style={{ height: 1, background: '#f0f2f5', margin: '10px 4px 12px' }} />}
              <p style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.10em', color: '#c4c9d4',
                padding: '0 10px', marginBottom: 4, marginTop: 0,
              }}>
                {section}
              </p>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map(item => {
                  if (item.children) {
                    const isOpen      = expanded.includes(item.label) || isChildActive(item.children)
                    const childActive = isChildActive(item.children)

                    return (
                      <li key={item.label}>
                        <button
                          onClick={() => toggle(item.label)}
                          style={{
                            ...itemStyle(childActive),
                            justifyContent: 'space-between',
                          }}
                          onMouseEnter={e => {
                            if (!childActive) (e.currentTarget as HTMLButtonElement).style.background = '#f7f8fa'
                          }}
                          onMouseLeave={e => {
                            if (!childActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <item.icon size={16} weight="regular"
                              color={childActive ? '#1e4da1' : '#9ca3af'} />
                            {item.label}
                          </span>
                          {isOpen ? <CaretDown size={11} /> : <CaretRight size={11} />}
                        </button>

                        {isOpen && (
                          <ul style={{ margin: '2px 0 4px', padding: 0, listStyle: 'none' }}>
                            {item.children.map(child => {
                              const active = location.pathname === child.to
                              return (
                                <li key={child.to}>
                                  <NavLink
                                    to={child.to} end
                                    style={{
                                      display: 'block',
                                      padding: '6px 12px 6px 38px',
                                      borderRadius: 7, fontSize: 13,
                                      fontWeight: active ? 600 : 400,
                                      color: active ? '#0d2137' : '#9ca3af',
                                      background: active ? '#eef1f8' : 'transparent',
                                      textDecoration: 'none', transition: 'all 0.12s',
                                    }}
                                    onMouseEnter={e => {
                                      if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#f7f8fa'
                                    }}
                                    onMouseLeave={e => {
                                      if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                                    }}
                                  >
                                    {child.label}
                                  </NavLink>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  }

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to!}
                        end={item.to === '/dashboard'}
                        style={({ isActive }) => itemStyle(isActive)}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLAnchorElement
                          if (!el.getAttribute('aria-current')) el.style.background = '#f7f8fa'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLAnchorElement
                          if (!el.getAttribute('aria-current')) el.style.background = 'transparent'
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon size={16} weight="regular"
                              color={isActive ? '#1e4da1' : '#9ca3af'} />
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User dock */}
        <div style={{ borderTop: '1px solid #f0f2f5', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: '#0d2137',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
              <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {roleName}
              </p>
            </div>
            <button
              onClick={logout} title="Sign out"
              style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#d1d5db', transition: 'all 0.12s', display: 'flex' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            >
              <SignOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
