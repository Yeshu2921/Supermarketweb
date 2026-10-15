
import { useState } from "react";
import "./OwnerLogin.css";

export default function OwnerLogin({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
  e.preventDefault();

  // Frontend demonstration only.
  // Connect the Node.js API before using real accounts.
  if (typeof onLogin === "function") {
    onLogin();
  }
}

  function handleReset(e) {
    e.preventDefault();

    // Connect this to your secure password recovery API later.
    alert("Password recovery API is not connected yet.");
  }

  return (
    <main className="owner-login-page">
      <section className="login-wrapper">
        <aside className="login-brand">
          <div className="brand-logo">🛒</div>

          <h1>
            Supermarket <span>System</span>
          </h1>

          <p className="brand-description">
            Manage your products, workers, suppliers,
            and sales — all in one place.
          </p>

          <div className="brand-feature">
            <span>✓</span>
            <div>
              <h6>Secure Access</h6>
              <p>Authorized account access.</p>
            </div>
          </div>

          <div className="brand-feature">
            <span>✓</span>
            <div>
              <h6>Easy Management</h6>
              <p>Track products, stock, and sales.</p>
            </div>
          </div>

          <div className="brand-feature">
            <span>✓</span>
            <div>
              <h6>Better Organization</h6>
              <p>Manage workers and suppliers.</p>
            </div>
          </div>

          <div className="brand-slogan">
            Fresh Products,
            <br />
            Better Tomorrow.
          </div>
        </aside>

        <section className="login-form-section">
          <div className="login-form-content">
            <div className="login-heading">
              <div className="heading-icon">🛒</div>

              <h2>
                {forgotPassword ? "Reset Password" : "Welcome Back!"}
              </h2>

              <p>
                {forgotPassword
                  ? "Enter your registered email to recover your account."
                  : "Sign in to your owner account to continue."}
              </p>
            </div>

            {!forgotPassword ? (
              <form onSubmit={handleLogin}>
                <div className="custom-input">
                  <label htmlFor="owner-email">Email Address</label>

                  <input
                    id="owner-email"
                    type="email"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="custom-input">
                  <label htmlFor="owner-password">Password</label>

                  <div className="password-wrapper">
                    <input
                      id="owner-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="login-options">
                  <span>Owner account access only</span>

                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="login-submit">
                  Sign In <span>→</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleReset}>
                <div className="custom-input">
                  <label htmlFor="reset-email">
                    Registered Email Address
                  </label>

                  <input
                    id="reset-email"
                    type="email"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <p className="reset-help">
                  If this email belongs to your owner account,
                  you can receive a secure password reset link.
                </p>

                <button type="submit" className="login-submit">
                  Send Reset Link <span>→</span>
                </button>

                <button
                  type="button"
                  className="back-to-login"
                  onClick={() => setForgotPassword(false)}
                >
                  ← Back to Login
                </button>
              </form>
            )}

            
          </div>
        </section>
      </section>

      <footer className="login-footer">
        © {new Date().getFullYear()} Supermarket Management System
      </footer>
    </main>
  );
}
