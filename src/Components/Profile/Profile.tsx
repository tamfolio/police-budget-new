import { useState } from 'react'
import { User, Lock, FloppyDisk } from '@phosphor-icons/react'
import { useCurrentUser, useUpdatePassword } from '../../hooks/useAuth'
import { getUserDisplayName, getUserRoleName } from '../../types'
import { PageHeader } from '../Common/PageHeader'
import { PageLoader } from '../Common/LoadingSpinner'

const Profile = () => {
  const [tab, setTab] = useState<'info' | 'password'>('info')
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false })

  const { data: user, isLoading } = useCurrentUser()
  const { mutate: updatePassword, isPending: updatingPassword } = useUpdatePassword()

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPass !== passwords.confirm) return
    updatePassword(passwords.newPass, {
      onSuccess: () => setPasswords({ current: '', newPass: '', confirm: '' }),
    })
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500'

  if (isLoading) return <PageLoader />

  const displayName = user ? getUserDisplayName(user) : ''
  const roleName = user ? getUserRoleName(user) : '—'
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your account information and password" />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Avatar banner */}
        <div className="bg-gradient-to-r from-[#0d2137] to-blue-800 px-6 py-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{displayName || user?.email}</p>
            <p className="text-sm text-blue-200">{user?.email}</p>
            {roleName !== '—' && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/20 text-amber-300">
                {roleName}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[
            { key: 'info', label: 'Account Info', icon: User },
            { key: 'password', label: 'Change Password', icon: Lock },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'info' | 'password')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'info' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input disabled value={displayName || '—'} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input disabled value={user?.email ?? ''} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <input disabled value={roleName} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                  <input disabled value={user?.department ?? '—'} className={inputCls} />
                </div>
              </div>
              <p className="text-xs text-slate-400">Contact your administrator to update your account information.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {[
                { key: 'current', label: 'Current Password', field: 'current' as const },
                { key: 'newPass', label: 'New Password', field: 'newPass' as const },
                { key: 'confirm', label: 'Confirm New Password', field: 'confirm' as const },
              ].map(({ key, label, field }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showPass[field] ? 'text' : 'password'}
                      required
                      value={passwords[field]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                      className={`${inputCls} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPass((s) => ({ ...s, [field]: !s[field] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                      {showPass[field] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ))}
              {passwords.confirm && passwords.newPass !== passwords.confirm && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
              <button
                type="submit"
                disabled={updatingPassword || !passwords.newPass || passwords.newPass !== passwords.confirm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                <FloppyDisk size={15} />
                {updatingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
