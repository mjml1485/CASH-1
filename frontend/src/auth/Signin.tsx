import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { FormEvent } from 'react';

export default function Signin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState({ email: false, password: false });

  const validate = (): string | null => {
    if (!email.trim()) return 'Please enter an email';
    if (!password) return 'Please enter your password';
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate('/onboarding/welcome');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sign-in-page">
      <div className="sign-in-card">
        <form className="sign-in-form" onSubmit={handleSubmit}>
          <div className="sign-in-form-inner">
            <div className="sign-in-header">
              <h1 className="sign-in-title">CASH</h1>
              <p className="sign-in-subtitle">CLOUD ACCESS SYNCHRONIZED HUB</p>
            </div>

            <label className="sign-in-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder={email || !hasInteracted.email ? 'Enter email' : ''}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setHasInteracted(prev => ({ ...prev, email: true }));
              }}
              onFocus={() => setHasInteracted(prev => ({ ...prev, email: true }))}
              onBlur={() => {
                if (!email.trim()) {
                  setHasInteracted(prev => ({ ...prev, email: false }));
                }
              }}
              disabled={submitting}
              autoComplete="email"
              className="sign-in-input"
            />

            <div className="sign-in-row-between">
              <label className="sign-in-label" htmlFor="password">
                Password
              </label>
              <Link className="sign-in-link-forgot" to="/forgot">
                Forgot?
              </Link>
            </div>

            <div className="sign-in-wrapper-password">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={password || !hasInteracted.password ? 'Enter your password' : ''}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setHasInteracted(prev => ({ ...prev, password: true }));
                }}
                onFocus={() => setHasInteracted(prev => ({ ...prev, password: true }))}
                onBlur={() => {
                  if (!password.trim()) {
                    setHasInteracted(prev => ({ ...prev, password: false }));
                  }
                }}
                disabled={submitting}
                autoComplete="current-password"
                className="sign-in-input"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="sign-in-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && <div className="sign-in-error">{error}</div>}

            <div className="sign-in-button-row">
              <button className="sign-in-button-primary" disabled={submitting} type="submit">
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="sign-in-footer">
              Don't have an account yet? <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
