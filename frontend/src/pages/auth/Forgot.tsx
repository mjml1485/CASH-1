import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Forgot() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasInteracted, setHasInteracted] = useState({ email: false });

  const [authError, setAuthError] = useState<string | null>(null);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    setSubmitting(true);
    setAuthError(null);
    const emailInput = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
    emailInput.setCustomValidity('');

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

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setAuthError('This email is not registered.');
      } else if (code === 'auth/invalid-email') {
        emailInput.setCustomValidity('Please enter a valid email address.');
        emailInput.reportValidity();
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

            {!success ? (
              <>
                <label className="sign-in-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder={email || !hasInteracted.email ? 'Enter your email' : ''}
                  value={email}
                  onChange={(e) => { 
                      setEmail(e.target.value); 
                      setHasInteracted(p => ({ ...p, email: true }));
                      e.target.setCustomValidity('');
                      if (authError) setAuthError(null);
                    }}
                  onFocus={() => setHasInteracted(p => ({ ...p, email: true }))}
                  onBlur={() => { 
                      if (!email.trim()) setHasInteracted(p => ({ ...p, email: false })); 
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
                  className="sign-in-input"
                />
                {authError && (
                  <div className="sign-in-error" style={{ margin: '12px 0', color: '#fc8181', fontWeight: 500 }}>
                    {authError}
                  </div>
                )}
                <div className="sign-in-button-row">
                  <button className="sign-in-button-primary" disabled={submitting} type="submit">
                    {submitting ? 'Sending...' : 'Send password reset email'}
                  </button>
                </div>
                <div className="sign-in-footer">
                  Remember your password? <Link to="/signin">Sign in</Link>
                </div>
              </>
            ) : (
              <>
                <div className="sign-in-success-title">Check your email</div>
                <p className="sign-in-success-message">
                  We’ve sent a password reset link to your email. Click the link to create a new password.
                </p>
                <div className="sign-in-button-row">
                  <button 
                    className="sign-in-button-primary" 
                    type="button" 
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                  >
                    Try another email
                  </button>
                </div>
                <div className="sign-in-footer">
                  Remember your password? <Link to="/signin">Sign in</Link>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

