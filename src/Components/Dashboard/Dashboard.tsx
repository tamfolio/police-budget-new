import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ErrorBoundary } from '../Common/ErrorBoundary'

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f5f7fa' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto" style={{ padding: '28px 32px' }}>
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
