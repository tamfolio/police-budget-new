import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react'
import { useLogin } from '../../hooks/useAuth'

// Dev-only credentials from .env.local; never read in production builds.
const IS_DEV = import.meta.env.DEV
const DEV_EMAIL = IS_DEV ? import.meta.env.VITE_DEV_EMAIL : undefined
const DEV_PASSWORD = IS_DEV ? import.meta.env.VITE_DEV_PASSWORD : undefined

const Login = () => {
  const [email, setEmail] = useState(IS_DEV && DEV_EMAIL ? DEV_EMAIL : '')
  const [password, setPassword] = useState(IS_DEV && DEV_PASSWORD ? DEV_PASSWORD : '')
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: login, isPending } = useLogin()

  const quickLogin = () => {
    if (DEV_EMAIL && DEV_PASSWORD) login({ email: DEV_EMAIL, password: DEV_PASSWORD })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: '#0d2137' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src="/npf-logo.png" alt="NPF Logo" className="h-12 w-12 object-contain" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Nigeria Police Force</p>
            <p className="text-slate-400 text-xs">Budget Management System</p>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <div className="w-12 h-1 bg-amber-500 rounded mb-6" />
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Transparent.<br />
            <span className="text-amber-400">Accountable.</span><br />
            Efficient.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            A centralised platform for managing NPF fund inflows, AIE allocations, distributions, and financial reporting across all zones and formations.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { label: 'Fund Inflows', desc: 'Track & approve' },
              { label: 'AIE Budgets', desc: 'Allocate & monitor' },
              { label: 'Distributions', desc: 'Zones & formations' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-white text-xs font-semibold">{item.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Nigeria Police Force · Confidential Government System
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src="/npf-logo.png" alt="NPF" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Nigeria Police Force</p>
              <p className="text-xs text-slate-500">Budget Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@npf.gov.ng"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgotpassword" className="text-xs text-blue-700 hover:text-blue-800 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword
                    ? <EyeSlash size={16} />
                    : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>

            {IS_DEV && DEV_EMAIL && DEV_PASSWORD && (
              <button
                type="button"
                onClick={quickLogin}
                disabled={isPending}
                className="w-full py-2 px-4 border border-dashed border-slate-300 text-slate-500 text-xs font-medium rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                ⚡ Dev quick login
              </button>
            )}
          </form>

          <div className="mt-8 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
            <ShieldCheck size={16} weight="fill" className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This is a secure government system. Unauthorised access is prohibited and may be subject to prosecution.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
