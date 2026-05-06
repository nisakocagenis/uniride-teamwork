import { useState } from 'react';
import API_BASE_URLS from "../config/api";

function Login({ onLogin, onBack, onGoRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URLS.USER}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u) => {
    setUsername(u);
    setPassword('123');
    setError('');
  };

  return (
    <div className="login-container">

      {/* Left panel */}
      <div className="login-left">
        <button className="login-back-btn" onClick={onBack}>← Back to Home</button>
        <div className="login-brand">
          <div className="login-brand-logo">UniRide</div>
          <p className="login-brand-tagline">University Car Sharing Platform</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <span className="lf-icon">🔒</span>
            <div>
              <strong>Secure Escrow Payments</strong>
              <p>Your money is protected until the rental is confirmed.</p>
            </div>
          </div>
          <div className="login-feature">
            <span className="lf-icon">✅</span>
            <div>
              <strong>Verified Users Only</strong>
              <p>All users pass identity and license verification.</p>
            </div>
          </div>
          <div className="login-feature">
            <span className="lf-icon">🎓</span>
            <div>
              <strong>Campus Community</strong>
              <p>Built exclusively for university students.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to your UniRide account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>University Email</label>
              <input
                type="email"
                placeholder="yourname@stu.university.edu.tr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: '#666' }}>
            Don't have an account?{' '}
            <button
              onClick={onGoRegister}
              style={{ background: 'none', border: 'none', color: '#d3101f', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              Sign Up
            </button>
          </p>

          <div className="login-demo">
            <p className="login-demo-title">Demo accounts</p>
            <div className="login-demo-cards">
              <div className="login-demo-card" onClick={() => fillDemo('yaren.kaya@stu.ege.edu.tr')}>
                <span className="demo-role-icon">👤</span>
                <div>
                  <strong>Yaren Kaya</strong>
                  <span>Renter · yaren.kaya@stu.ege.edu.tr / 123</span>
                </div>
              </div>
              <div className="login-demo-card" onClick={() => fillDemo('cagri.kaya@stu.yasar.edu.tr')}>
                <span className="demo-role-icon">🚗</span>
                <div>
                  <strong>Çağrı Kaya</strong>
                  <span>Car Owner · cagri.kaya@stu.yasar.edu.tr / 123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Login;
