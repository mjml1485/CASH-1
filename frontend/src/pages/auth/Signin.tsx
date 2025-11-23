import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Signin() {
  const navigate = useNavigate();
  const { signIn, currentUser, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState({ email: false, password: false });
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    const emailInput = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = e.currentTarget.elements.namedItem('password') as HTMLInputElement;
    emailInput.setCustomValidity('');
    passwordInput.setCustomValidity('');

    if (!email.trim()) {
      emailInput.setCustomValidity('Please enter your email address.');
      emailInput.reportValidity();
      setSubmitting(false);
      return;
    }
    if (!password) {
      passwordInput.setCustomValidity('Please enter your password.');
      passwordInput.reportValidity();
      setSubmitting(false);
      return;
    }

    try {
      await signIn(email, password);
      navigate('/onboarding/welcome');
    } catch (err: any) {
      const code = err?.code || '';
      // A. Email not registered
      if (code === 'auth/user-not-found') {
        setAuthError('This email is not registered.');
      // B. Email registered but wrong password
      } else if (code === 'auth/wrong-password') {
        setAuthError('Incorrect password. Please try again.');
      // Invalid email format or generic credential issue
      } else if (code === 'auth/invalid-email' || code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else if (err?.message) {
        setAuthError(err.message);
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
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
                e.target.setCustomValidity('');
                if (authError) setAuthError(null);
              }}
              onFocus={() => setHasInteracted(prev => ({ ...prev, email: true }))}
              onBlur={() => {
                if (!email.trim()) {
                  setHasInteracted(prev => ({ ...prev, email: false }));
                }
              }}
              onInvalid={(e) => {
                e.currentTarget.setCustomValidity('Please enter a valid email address.');
              }}
              disabled={submitting}
              autoComplete="email"
              required
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
                  e.target.setCustomValidity('');
                  if (authError) setAuthError(null);
                }}
                onFocus={() => setHasInteracted(prev => ({ ...prev, password: true }))}
                onBlur={() => {
                  if (!password.trim()) {
                    setHasInteracted(prev => ({ ...prev, password: false }));
                  }
                }}
                onInvalid={(e) => {
                  if (!e.currentTarget.value) {
                    e.currentTarget.setCustomValidity('Please enter your password.');
                  } else {
                    e.currentTarget.setCustomValidity('');
                  }
                }}
                disabled={submitting}
                autoComplete="current-password"
                required
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

            {authError && (
              <div className="sign-in-error" style={{ margin: '12px 0', color: '#fc8181', fontWeight: 500 }}>
                {authError}
              </div>
            )}
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
