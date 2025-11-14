import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import type { FormEvent } from "react";

export default function Signin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function validate() {
        if (!email.trim()) return "Please enter an email";
        if (!password) return "Please enter your password";
        return null;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        const v = validate();
        if (v) return setError(v);
        setSubmitting(true);
        try {
            await new Promise((res) => setTimeout(res, 800));
            console.log("signed in", { email });
        } catch (err) {
            setError("Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">CASH</h1>
                <div className="auth-sub">CLOUD ACCESS SYNCHRONIZED HUB</div>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="form-inner">
                        <label className="field-label">Email</label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <div className="row-between">
                            <label className="field-label mt">Password</label>
                            <a className="forgot-link" href="#">Forgot ?</a>
                        </div>

                        <div className="input-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                aria-pressed={showPassword}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="password-toggle"
                                onClick={() => setShowPassword((s) => !s)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        {error && <div className="error-text">{error}</div>}

                        <div className="cta-row">
                            <button className="primary" disabled={submitting} type="submit">
                                {submitting ? "Signing in..." : "Sign In"}
                            </button>
                        </div>

                        <div className="card-footer muted">
                            Don't Have An Account Yet? <Link to="/signup">Sign Up</Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
