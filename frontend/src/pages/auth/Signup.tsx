import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, currentUser, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState({ name: false, email: false, password: false, confirmPassword: false });
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

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      await signUp(email, password, name);
      navigate('/onboarding/welcome');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setAuthError('Email already registered. Please sign in.');
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sign-up-page">
      <div className="sign-up-card">
        <form className="sign-up-form" onSubmit={handleSubmit}>
          <div className="sign-up-form-inner">
            <div className="sign-up-header">
              <h1 className="sign-up-title">CASH</h1>
              <p className="sign-up-subtitle">CLOUD ACCESS SYNCHRONIZED HUB</p>
            </div>

            <label className="sign-up-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder={name || !hasInteracted.name ? 'Enter name' : ''}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setHasInteracted(prev => ({ ...prev, name: true }));
              }}
              onFocus={() => setHasInteracted(prev => ({ ...prev, name: true }))}
              onBlur={() => {
                if (!name.trim()) {
                  setHasInteracted(prev => ({ ...prev, name: false }));
                }
              }}
              disabled={submitting}
              autoComplete="name"
              required
              className="sign-up-input"
            />

            <label className="sign-up-label" htmlFor="email">
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
              className="sign-up-input"
            />


            <div className="sign-up-row-between">
              <label className="sign-up-label" htmlFor="password">
                Password
              </label>
            </div>


            <div className="sign-up-wrapper-password">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={password || !hasInteracted.password ? 'Enter your password' : ''}
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  setHasInteracted(prev => ({ ...prev, password: true }));
                  e.target.setCustomValidity('');

                  // Validate password strength
                  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
                  if (!passwordRegex.test(value)) {
                    e.target.setCustomValidity('Password must be at least 6 characters, include at least one uppercase letter, and one number.');
                  }

                  if (authError) setAuthError(null);
                }}
                onFocus={() => setHasInteracted(prev => ({ ...prev, password: true }))}
                onBlur={() => {
                  if (!password.trim()) {
                    setHasInteracted(prev => ({ ...prev, password: false }));
                  }
                }}
                onInvalid={(e) => {
                  e.currentTarget.setCustomValidity('Password must be at least 6 characters, with a number and an uppercase letter.');
                }}
                disabled={submitting}
                autoComplete="new-password"
                required
                minLength={6}
                className="sign-up-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="sign-up-toggle-password sign-up-toggle-password-margin"
                disabled={submitting}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>


            <label className="sign-up-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <div className="sign-up-wrapper-password">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={confirmPassword || !hasInteracted.confirmPassword ? 'Confirm your password' : ''}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setHasInteracted(prev => ({ ...prev, confirmPassword: true }));
                  e.target.setCustomValidity('');
                  if (authError) setAuthError(null);
                }}
                onFocus={() => setHasInteracted(prev => ({ ...prev, confirmPassword: true }))}
                onBlur={() => {
                  if (!confirmPassword.trim()) {
                    setHasInteracted(prev => ({ ...prev, confirmPassword: false }));
                  }
                }}
                disabled={submitting}
                autoComplete="new-password"
                required
                minLength={6}
                className="sign-up-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-pressed={showConfirmPassword}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="sign-up-toggle-password sign-up-toggle-password-margin"
                disabled={submitting}
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {authError && (
              <div className="sign-up-error sign-up-error-custom">
                {authError}
              </div>
            )}
            <div className="sign-up-button-row">
              <button className="sign-up-button-primary" disabled={submitting} type="submit">
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className="sign-up-footer">
              Already Have An Account ? <Link to="/signin">Sign in</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
