import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';

type Step = 'email' | 'verify' | 'reset' | 'done';

const CODE_LENGTH = 6;
const EXP_MINUTES = 10;

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const visible = user.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(1, user.length - 1))}@${domain}`;
}

export default function Forgot() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState({ email: false, code: false, password: false, confirm: false });

  const currentUser = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) as { email?: string; name?: string; password?: string } : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const resetEmail = sessionStorage.getItem('resetEmail');
    const resetCode = sessionStorage.getItem('resetCode');
    const resetExp = sessionStorage.getItem('resetExpires');
    if (resetEmail && resetCode && resetExp) {
      setEmail(resetEmail);
      setStep('verify');
      setInfo(`We sent a ${CODE_LENGTH}-digit code to ${maskEmail(resetEmail)}.`);
    }
  }, []);

  const validateEmail = (): string | null => {
    if (!email.trim()) return 'Please enter an email';
    if (!email.includes('@') || !email.includes('.')) return 'Please enter a valid email';
    return null;
  };

  const sendCode = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfo(null);
    const v = validateEmail();
    if (v) {
      setError(v);
      return;
    }
    if (!currentUser || currentUser.email !== email.trim()) {
      setError('No account found with that email.');
      return;
    }
    setSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 600));
      const generated = String(Math.floor(10 ** (CODE_LENGTH - 1) + Math.random() * 9 * 10 ** (CODE_LENGTH - 1)));
      const expiresAt = Date.now() + EXP_MINUTES * 60 * 1000;
      sessionStorage.setItem('resetEmail', email.trim());
      sessionStorage.setItem('resetCode', generated);
      sessionStorage.setItem('resetExpires', String(expiresAt));
      setStep('verify');
      setInfo(`We sent a ${CODE_LENGTH}-digit code to ${maskEmail(email.trim())}.`);
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const storedCode = sessionStorage.getItem('resetCode');
    const exp = Number(sessionStorage.getItem('resetExpires') || 0);
    if (!storedCode) {
      setError('No active verification code. Please resend.');
      return;
    }
    if (Date.now() > exp) {
      setError('Code expired. Please resend a new one.');
      return;
    }
    if (code.trim() !== storedCode) {
      setError('Incorrect code. Please try again.');
      return;
    }
    setSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 400));
      setStep('reset');
      setInfo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const validatePassword = (): string | null => {
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validatePassword();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 600));
      const raw = sessionStorage.getItem('currentUser');
      const data = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem('currentUser', JSON.stringify({ ...data, password }));
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetCode');
      sessionStorage.removeItem('resetExpires');
      setStep('done');
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sign-in-page">
      <div className="sign-in-card">
        <form className="sign-in-form" onSubmit={step === 'email' ? sendCode : step === 'verify' ? verifyCode : handleResetPassword}>
          <div className="sign-in-form-inner">
            <div className="sign-in-header">
              <h1 className="sign-in-title">CASH</h1>
              <p className="sign-in-subtitle">CLOUD ACCESS SYNCHRONIZED HUB</p>
            </div>

            {step === 'email' && (
              <>
                <label className="sign-in-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder={email || !hasInteracted.email ? 'Enter your email' : ''}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setHasInteracted(p => ({ ...p, email: true })); }}
                  onFocus={() => setHasInteracted(p => ({ ...p, email: true }))}
                  onBlur={() => { if (!email.trim()) setHasInteracted(p => ({ ...p, email: false })); }}
                  disabled={submitting}
                  autoComplete="email"
                  className="sign-in-input"
                />
                {error && <div className="sign-in-error">{error}</div>}
                <div className="sign-in-button-row">
                  <button className="sign-in-button-primary" disabled={submitting} type="submit">
                    {submitting ? 'Sending code...' : 'Send verification code'}
                  </button>
                </div>
              </>
            )}

            {step === 'verify' && (
              <>
                <div className="sign-in-label">Verification</div>
                <p className="sign-in-subtitle" style={{ marginTop: '-4px' }}>
                  {info || `Enter the ${CODE_LENGTH}-digit code we sent to ${maskEmail(email || sessionStorage.getItem('resetEmail') || '')}.`}
                </p>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={CODE_LENGTH}
                  placeholder={code || !hasInteracted.code ? 'Enter verification code' : ''}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setHasInteracted(p => ({ ...p, code: true })); }}
                  onFocus={() => setHasInteracted(p => ({ ...p, code: true }))}
                  onBlur={() => { if (!code.trim()) setHasInteracted(p => ({ ...p, code: false })); }}
                  disabled={submitting}
                  className="sign-in-input"
                />
                {error && <div className="sign-in-error">{error}</div>}
                <div className="sign-in-button-row">
                  <button className="sign-in-button-primary" disabled={submitting} type="submit">
                    {submitting ? 'Verifying...' : 'Verify code'}
                  </button>
                </div>
                <div className="sign-in-footer">
                  Didn't get a code?{' '}
                  <button type="button" className="sign-in-link-forgot" onClick={() => sendCode()} disabled={submitting}>
                    Resend
                  </button>
                </div>
              </>
            )}

            {step === 'reset' && (
              <>
                <label className="sign-in-label" htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={password || !hasInteracted.password ? 'Enter new password' : ''}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setHasInteracted(p => ({ ...p, password: true })); }}
                  onFocus={() => setHasInteracted(p => ({ ...p, password: true }))}
                  onBlur={() => { if (!password.trim()) setHasInteracted(p => ({ ...p, password: false })); }}
                  disabled={submitting}
                  className="sign-in-input"
                  autoComplete="new-password"
                />
                <label className="sign-in-label" htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={confirmPassword || !hasInteracted.confirm ? 'Confirm new password' : ''}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setHasInteracted(p => ({ ...p, confirm: true })); }}
                  onFocus={() => setHasInteracted(p => ({ ...p, confirm: true }))}
                  onBlur={() => { if (!confirmPassword.trim()) setHasInteracted(p => ({ ...p, confirm: false })); }}
                  disabled={submitting}
                  className="sign-in-input"
                  autoComplete="new-password"
                />
                <div className="sign-in-button-row" style={{ gap: 12 }}>
                  <button
                    type="button"
                    className="sign-in-button-primary"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={submitting}
                  >
                    {showPassword ? 'Hide' : 'Show'} New
                  </button>
                  <button
                    type="button"
                    className="sign-in-button-primary"
                    onClick={() => setShowConfirm((s) => !s)}
                    disabled={submitting}
                  >
                    {showConfirm ? 'Hide' : 'Show'} Confirm
                  </button>
                </div>
                {error && <div className="sign-in-error">{error}</div>}
                <div className="sign-in-button-row">
                  <button className="sign-in-button-primary" disabled={submitting} type="submit">
                    {submitting ? 'Saving...' : 'Reset password'}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <>
                <div className="sign-in-label">Password reset successful</div>
                <p className="sign-in-subtitle" style={{ marginTop: '-4px' }}>
                  You can now sign in with your new password.
                </p>
                <div className="sign-in-button-row">
                  <button className="sign-in-button-primary" type="button" onClick={() => navigate('/signin')}>
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
