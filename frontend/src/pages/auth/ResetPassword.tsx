import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import type { FormEvent } from 'react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasInteracted, setHasInteracted] = useState({ password: false, confirmPassword: false });

  const [authError, setAuthError] = useState<string | null>(null);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const passwordInput = e.currentTarget.elements.namedItem('new-password') as HTMLInputElement;
    const confirmInput = e.currentTarget.elements.namedItem('confirm-password') as HTMLInputElement;
    passwordInput.setCustomValidity('');
    confirmInput.setCustomValidity('');

    if (!oobCode) {
      setAuthError('This password reset link is invalid. Please request a new one.');
      return;
    }
    if (!newPassword) {
      passwordInput.setCustomValidity('Please enter a new password.');
      passwordInput.reportValidity();
      return;
    }
    if (newPassword.length < 6) {
      passwordInput.setCustomValidity('Password must be at least 6 characters.');
      passwordInput.reportValidity();
      return;
    }
    if (!confirmPassword) {
      confirmInput.setCustomValidity('Please confirm your password.');
      confirmInput.reportValidity();
      return;
    }
    if (newPassword !== confirmPassword) {
      confirmInput.setCustomValidity('Password and confirmation do not match.');
      confirmInput.reportValidity();
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err: any) {
      if (err.code === 'auth/expired-action-code') {
        setAuthError('Your password reset link has expired. Please request a new one.');
      } else if (err.code === 'auth/invalid-action-code') {
        setAuthError('This password reset link is invalid. Please request a new one.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Please use a stronger password with letters and numbers.');
      } else {
        setAuthError(err.message || 'Failed to reset password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!oobCode) {
    navigate('/forgot');
    return null;
  }

  if (success) {
    return (
      <div className="sign-in-page">
        <div className="sign-in-card">
          <div className="sign-in-form-inner">
            <div className="sign-in-header">
              <h1 className="sign-in-title">CASH</h1>
              <p className="sign-in-subtitle">CLOUD ACCESS SYNCHRONIZED HUB</p>
            </div>
            <div className="sign-in-label sign-in-label-success">Password Reset Successful!</div>
            <p className="sign-in-subtitle sign-in-subtitle-reset-success">
              Your password has been reset. Redirecting to sign in...
            </p>
            <div className="sign-in-button-row">
              <button 
                className="sign-in-button-primary" 
                type="button" 
                onClick={() => navigate('/signin')}
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-in-page">
      <div className="sign-in-card">
        <form className="sign-in-form" onSubmit={handleSubmit}>
          <div className="sign-in-form-inner">
            <div className="sign-in-header">
              <h1 className="sign-in-title">CASH</h1>
              <p className="sign-in-subtitle">CLOUD ACCESS SYNCHRONIZED HUB</p>
            </div>

            <label className="sign-in-label" htmlFor="new-password">Reset Your Password</label>

            <label className="sign-in-label" htmlFor="new-password">New Password</label>
            <div className="sign-in-wrapper-password">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={newPassword || !hasInteracted.password ? 'Enter new password' : ''}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setHasInteracted(prev => ({ ...prev, password: true }));
                  e.target.setCustomValidity('');
                  if (authError) setAuthError(null);
                }}
                onFocus={() => setHasInteracted(prev => ({ ...prev, password: true }))}
                onBlur={() => {
                  if (!newPassword.trim()) {
                    setHasInteracted(prev => ({ ...prev, password: false }));
                  }
                }}
                disabled={submitting}
                required
                minLength={6}
                className="sign-in-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="sign-in-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>


            <label className="sign-in-label" htmlFor="confirm-password">Confirm Password</label>
            <div className="sign-in-wrapper-password">
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={confirmPassword || !hasInteracted.confirmPassword ? 'Confirm new password' : ''}
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
                required
                minLength={6}
                className="sign-in-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="sign-in-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {authError && (
              <div className="sign-in-error sign-in-error-custom">
                {authError}
              </div>
            )}
            <div className="sign-in-button-row">
              <button className="sign-in-button-primary" disabled={submitting} type="submit">
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

