import type { FormEvent } from 'react'
import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate() {
    if (!name.trim()) return 'Name is required'
    if (!email.includes('@')) return 'Valid email required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) return setError(v)
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      console.log('signup', { name, email })
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError('Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">CASH</h1>
        <div className="muted auth-sub">CLOUD ACCESS SYNCHRONIZED HUB EXPENSE TRACKER</div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-inner">
            <label className="field-label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />

            <label className="field-label mt">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />

            <div className="row-between">
              <label className="field-label label-gap">Password</label>
              <a className="forgot-link" href="#">Forgot ?</a>
            </div>

            <div className="input-wrap">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="password-toggle"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && <div className="error-text">{error}</div>}

            <div className="cta-row">
              <button className="primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create account'}
              </button>
            </div>

            <div className="card-footer muted">
              Already Have An Account ? <a href="#">Log In</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
