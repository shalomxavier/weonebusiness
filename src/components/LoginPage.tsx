import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  const handleForgotPassword = async () => {
    const target = email.trim()
    if (!target) {
      setError('Enter your email above, then click Forgot password.')
      return
    }
    setError('')
    setResetMsg('')
    try {
      await resetPassword(target)
      setResetMsg('Password reset email sent. Check your inbox.')
    } catch {
      setError('Failed to send reset email. Check the address and try again.')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError('Invalid email or password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-white mb-8">WeOne</h1>
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-10 shadow-2xl space-y-6">
        <p className="text-base text-gray-400 text-center">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-1 mb-5">
            <label htmlFor="email" className="block text-base font-medium text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-white/20 rounded-xl text-base bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
            />
          </div>

          <div className="space-y-1 mb-[30px]">
            <label htmlFor="password" className="block text-base font-medium text-gray-200">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-white/20 rounded-xl text-base bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-base text-red-400 text-center mb-5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ outline: 'none', boxShadow: 'none' }}
            onMouseDown={(e) => e.preventDefault()}
            className="border border-white/20 w-full gap-2 justify-center rounded-xl bg-gradient-to-r from-[#FF1493] via-[#C71585] to-[#FF1493] text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,20,147,0.5)] transition-all duration-200 bg-[length:200%_100%] hover:bg-[position:100%_0] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 py-2.5 px-4 font-medium"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center mt-3 text-sm text-gray-400">
            <button type="button" onClick={handleForgotPassword} className="text-gray-400 hover:text-gray-300 transition-colors duration-150">
              Forgot password?
            </button>
          </p>

          {resetMsg && (
            <p className="text-center mt-2 text-sm text-gray-400">{resetMsg}</p>
          )}
        </form>
      </div>
    </div>
  )
}
