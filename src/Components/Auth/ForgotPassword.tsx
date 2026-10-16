import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, EnvelopeSimple, ShieldCheck } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../utils/errorHandlers'
import apiClient from '../../api/client'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { mutate: send, isPending } = useMutation({
    mutationFn: (email: string) => apiClient.post('/auth/forgot-password', { email }),
    onSuccess: () => setSent(true),
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(email)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/npf-logo.png" alt="NPF" className="h-10 w-10 object-contain" />
          <div>
            <p className="font-bold text-slate-900 text-sm">Nigeria Police Force</p>
            <p className="text-xs text-slate-500">Budget Management System</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <EnvelopeSimple size={28} weight="duotone" className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              If an account exists for{' '}
              <span className="font-medium text-slate-700">{email}</span>, you'll receive a password reset link shortly.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your email and we'll send you a reset link.
              </p>
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

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={15} /> Back to sign in
              </Link>
            </div>
          </>
        )}

        <div className="mt-10 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <ShieldCheck size={15} weight="fill" className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">Authorised personnel only. All access attempts are logged.</p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
