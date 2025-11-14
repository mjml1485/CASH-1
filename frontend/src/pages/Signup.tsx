import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { FormEvent } from 'react';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required';
    if (!email.includes('@') || !email.includes('.')) return 'Please enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
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
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate('/onboarding');
    } catch (err) {
      setError('Signup failed. Please try again.');
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
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoComplete="name"
              className="sign-up-input"
            />

            <label className="sign-up-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
              className="sign-up-input"
            />

            <div className="sign-up-row-between">
              <label className="sign-up-label" htmlFor="password">
                Password
              </label>
              <a className="sign-up-link-forgot" href="#" onClick={(e) => e.preventDefault()}>
                Forgot ?
              </a>
            </div>

            <div className="sign-up-wrapper-password">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                className="sign-up-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="sign-up-toggle-password"
                disabled={submitting}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && <div className="sign-up-error">{error}</div>}

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
