import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createOrUpdateProfileBackend } from '../../services/userService';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, signIn, currentUser, loading } = useAuth();
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
    const emailInput = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = e.currentTarget.elements.namedItem('password') as HTMLInputElement;
    const confirmInput = e.currentTarget.elements.namedItem('confirm-password') as HTMLInputElement;
    emailInput.setCustomValidity('');
    passwordInput.setCustomValidity('');
    confirmInput.setCustomValidity('');

    if (!email.trim()) {
      emailInput.setCustomValidity('Please enter your email address.');
      emailInput.reportValidity();
      setSubmitting(false);
      return;
    }
    if (emailInput.validity.typeMismatch) {
      emailInput.setCustomValidity('Please enter a valid email address.');
      emailInput.reportValidity();
      setSubmitting(false);
      return;
    }
        const strongPassword = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!password) {
          passwordInput.setCustomValidity('Please create a password.');
          passwordInput.reportValidity();
          setSubmitting(false);
          return;
        }
        if (!strongPassword.test(password)) {
          passwordInput.setCustomValidity('Password must be at least 6 characters, include a number and an uppercase letter.');
          passwordInput.reportValidity();
          setSubmitting(false);
          return;
        }
    if (!confirmPassword) {
      confirmInput.setCustomValidity('Please confirm your password.');
      confirmInput.reportValidity();
      setSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      confirmInput.setCustomValidity('Password and confirmation do not match.');
      confirmInput.reportValidity();
      setSubmitting(false);
      return;
    }

    try {
      await signUp(email, password, name); 
      navigate('/onboarding/welcome');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        try {
          await signIn(email, password);
          const defaultUsername = name || email.split('@')[0];
          await createOrUpdateProfileBackend({ name: name || email.split('@')[0], username: defaultUsername });
          navigate('/onboarding/welcome');
          return;
        } catch (innerErr) {
          setAuthError('This email is already in use. Please sign in instead.');
        }
      } else if (code === 'auth/weak-password') {
        setAuthError('Your password is too weak.');
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
                if (!e.currentTarget.value) {
                  e.currentTarget.setCustomValidity('Please enter your email address.');
                } else {
                  e.currentTarget.setCustomValidity('Please enter a valid email address.');
                }
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
                    e.currentTarget.setCustomValidity('Please create a password.');
                  } else if (!/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(e.currentTarget.value)) {
                    e.currentTarget.setCustomValidity('Password must be at least 6 characters, include a number and an uppercase letter.');
                  } else {
                    e.currentTarget.setCustomValidity('');
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
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="sign-up-toggle-password"
                disabled={submitting}
                tabIndex={-1}
                style={{ marginLeft: 4 }}
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
                onInvalid={(e) => {
                  if (!e.currentTarget.value) {
                    e.currentTarget.setCustomValidity('Please confirm your password.');
                  } else if (e.currentTarget.value.length < 6) {
                    e.currentTarget.setCustomValidity('Password must be at least 6 characters.');
                  } else {
                    e.currentTarget.setCustomValidity('');
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
                className="sign-up-toggle-password"
                disabled={submitting}
                tabIndex={-1}
                style={{ marginLeft: 4 }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {authError && (
              <div className="sign-up-error" style={{ margin: '12px 0', color: '#fc8181', fontWeight: 500 }}>
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
