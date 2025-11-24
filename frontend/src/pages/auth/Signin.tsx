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
      // Check onboarding status and route accordingly
      const checkAndRoute = async () => {
        try {
          const { fetchProfileBackend } = await import('../../services/userService');
          const profile = await fetchProfileBackend();
          if (profile?.onboardingCompleted) {
            navigate('/dashboard');
          } else {
            navigate('/onboarding/welcome');
          }
        } catch (err) {
          console.error('Failed to check onboarding status:', err);
          // Default to onboarding if check fails
          navigate('/onboarding/welcome');
        }
      };
      checkAndRoute();
    }
  }, [currentUser, loading, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    try {
      await signIn(email, password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setAuthError('Email not registered. Please sign up.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. Please try again.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Unable to connect to the database. Please try again later.');
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
