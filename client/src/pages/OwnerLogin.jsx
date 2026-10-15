
import { useState } from "react";
import "./OwnerLogin.css";

export default function OwnerLogin({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      // Keep the token for this browser session.
      sessionStorage.setItem("freshmartToken", data.token);

      // Pass the authenticated user to App.jsx.
      if (typeof onLogin === "function") {
        onLogin(data.user, data.token);
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Check that your backend is running."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset(e) {
    e.preventDefault();

    setError(
      "Password recovery is not connected yet. Contact your system administrator."
    );
  }

  function returnToLogin() {
    setForgotPassword(false);
    setError("");
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

            {error && (
              <div className="login-message login-error" role="alert">
                {error}
              </div>
            )}

            {!forgotPassword ? (
              <form onSubmit={handleLogin}>
                <div className="custom-input">
                  <label htmlFor="owner-email">
                    Email Address
                  </label>

                  <input
                    id="owner-email"
                    type="email"
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="custom-input">
                  <label htmlFor="owner-password">
                    Password
                  </label>

                  <div className="password-wrapper">
                    <input
                      id="owner-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={loading}
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
                    onClick={() => {
                      setForgotPassword(true);
                      setError("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Sign In"}
                  {!loading && <span> →</span>}
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
                  Password recovery is not available yet.
                  Please contact your system administrator.
                </p>

                <button type="submit" className="login-submit">
                  Request Password Help <span>→</span>
                </button>

                <button
                  type="button"
                  className="back-to-login"
                  onClick={returnToLogin}
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
