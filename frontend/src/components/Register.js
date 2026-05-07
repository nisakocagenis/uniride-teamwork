import { useState, useRef, useEffect } from 'react';
import API_BASE_URLS from "../config/api";

const UNIVERSITIES = [
  'Ege University',
  'Yaşar University',
  'Dokuz Eylül University',
  'İzmir Institute of Technology',
  'İzmir University of Economics',
  'Other',
];

function FileUploadField({ label, hint, fieldName, file, onChange }) {
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  const boxStyle = {
    border: `2px dashed ${file ? '#d3101f' : '#d0d5e0'}`,
    borderRadius: '10px',
    padding: '18px 14px',
    textAlign: 'center',
    cursor: 'pointer',
    background: file ? '#fff0f0' : '#fafafa',
    transition: 'all 0.2s',
  };

  return (
    <div className="login-field">
      <label>{label}</label>
      <div
        style={boxStyle}
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          name={fieldName}
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.files[0])}
        />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>
              {file.name.endsWith('.pdf') ? '📄' : '🖼️'}
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#d3101f' }}>{file.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>⬆️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#444' }}>Click or drag & drop</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{hint}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Register({ onLogin, onBack, onGoLogin }) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    passwordConfirm: '',
    role: 'renter',
    university: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [criminalFile, setCriminalFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('form'); // 'form' | 'verifying' | 'approved'
  const [countdown, setCountdown] = useState(10);
  const pendingLogin = useRef(null);

  useEffect(() => {
    if (stage !== 'verifying') return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setStage('approved');
          setTimeout(() => {
            if (pendingLogin.current) {
              const { token, user } = pendingLogin.current;
              onLogin(token, user);
            }
          }, 2000);
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, onLogin]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) return setError('Passwords do not match.');
    if (!form.university) return setError('Please select your university.');
    if (!licenseFile) return setError("Please upload your driver's license.");
    if (!criminalFile) return setError('Please upload your criminal record document.');

    setLoading(true);
    try {
      const body = new FormData();
      body.append('username', form.username);
      body.append('password', form.password);
      body.append('name', form.name);
      body.append('role', form.role);
      body.append('university', form.university);
      body.append('license', licenseFile);
      body.append('criminalRecord', criminalFile);

      const res = await fetch(`${API_BASE_URLS.USER}/api/register`, {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      pendingLogin.current = { token: data.token, user: data.user };
      setStage('verifying');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'verifying' || stage === 'approved') {
    const approved = stage === 'approved';
    const progress = approved ? 100 : ((10 - countdown) / 10) * 100;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2d0505 0%, #1a0808 50%, #3d0010 100%)' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '56px 48px', textAlign: 'center', maxWidth: '420px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

          {/* Icon */}
          <div style={{ fontSize: '64px', marginBottom: '24px', transition: 'transform 0.4s', transform: approved ? 'scale(1.15)' : 'scale(1)' }}>
            {approved ? '✅' : '🔍'}
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
            {approved ? 'Documents Approved!' : 'Verifying Your Documents'}
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
            {approved
              ? 'Welcome to UniRide. Redirecting you now...'
              : 'Please wait while we review your driver\'s license and criminal record.'}
          </p>

          {/* Steps */}
          {!approved && (
            <div style={{ textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: "Driver's License", delay: 0 },
                { label: 'Criminal Record', delay: 4 },
                { label: 'Identity Check', delay: 7 },
              ].map(({ label, delay }) => {
                const elapsed = 10 - countdown;
                const done = elapsed >= delay + 2;
                const active = elapsed >= delay && !done;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', background: done ? '#38a169' : active ? '#d3101f' : '#e2e8f0', color: done || active ? '#fff' : '#aaa', transition: 'all 0.4s' }}>
                      {done ? '✓' : active ? '⋯' : '○'}
                    </div>
                    <span style={{ fontSize: '14px', color: done ? '#38a169' : active ? '#d3101f' : '#aaa', fontWeight: done || active ? 600 : 400, transition: 'color 0.4s' }}>{label}</span>
                    {active && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#d3101f', animation: 'pulse 1s infinite' }}>Checking...</span>}
                    {done && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#38a169' }}>Verified</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress bar */}
          <div style={{ background: '#f0f0f0', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ height: '100%', borderRadius: '99px', width: `${progress}%`, background: approved ? '#38a169' : '#d3101f', transition: 'width 0.9s ease, background 0.4s' }} />
          </div>

          {!approved && (
            <p style={{ fontSize: '13px', color: '#999' }}>
              Estimated time: <strong style={{ color: '#d3101f' }}>{countdown}s</strong>
            </p>
          )}
        </div>

        <style>{`
          @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        `}</style>
      </div>
    );
  }

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
            <span className="lf-icon">🎓</span>
            <div>
              <strong>Campus Community</strong>
              <p>Built exclusively for university students.</p>
            </div>
          </div>
          <div className="login-feature">
            <span className="lf-icon">🚗</span>
            <div>
              <strong>Rent or List Your Car</strong>
              <p>Earn as a car owner or find affordable rides on campus.</p>
            </div>
          </div>
          <div className="login-feature">
            <span className="lf-icon">🔒</span>
            <div>
              <strong>Verified Users Only</strong>
              <p>Documents are reviewed to keep the community safe.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Create an account</h2>
          <p className="login-subtitle">Join UniRide and get started today</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your first and last name"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            <div className="login-field">
              <label>University Email</label>
              <input
                type="email"
                placeholder="yourname@stu.university.edu.tr"
                value={form.username}
                onChange={set('username')}
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label>University</label>
              <select
                value={form.university}
                onChange={set('university')}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: '#fff',
                  color: form.university ? '#1a1a2e' : '#999',
                }}
              >
                <option value="">Select your university...</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="login-field">
              <label>I am a...</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%', padding: '11px 16px', border: `2px solid ${form.role === 'renter' ? '#d3101f' : '#e0e0e0'}`, borderRadius: '8px', background: form.role === 'renter' ? '#fff0f0' : '#fff', boxSizing: 'border-box' }}>
                  <input type="radio" name="role" value="renter" checked={form.role === 'renter'} onChange={set('role')} style={{ accentColor: '#d3101f', flexShrink: 0, margin: 0, width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: form.role === 'renter' ? '#d3101f' : '#444' }}>👤 Renter</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>I want to rent vehicles</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%', padding: '11px 16px', border: `2px solid ${form.role === 'owner' ? '#d3101f' : '#e0e0e0'}`, borderRadius: '8px', background: form.role === 'owner' ? '#fff0f0' : '#fff', boxSizing: 'border-box' }}>
                  <input type="radio" name="role" value="owner" checked={form.role === 'owner'} onChange={set('role')} style={{ accentColor: '#d3101f', flexShrink: 0, margin: 0, width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: form.role === 'owner' ? '#d3101f' : '#444' }}>🚗 Car Owner</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>I want to list my car</span>
                </label>
              </div>
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="login-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.passwordConfirm}
                onChange={set('passwordConfirm')}
                required
                autoComplete="new-password"
              />
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginTop: '4px' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>
                Required documents — JPG, PNG or PDF, max 5 MB each.
              </p>

              <FileUploadField
                label="Driver's License"
                hint="Front side of your driver's license"
                fieldName="license"
                file={licenseFile}
                onChange={setLicenseFile}
              />

              <FileUploadField
                label="Criminal Record Document"
                hint="Obtained from e-Devlet or notary"
                fieldName="criminalRecord"
                file={criminalFile}
                onChange={setCriminalFile}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: '#666' }}>
            Already have an account?{' '}
            <button
              onClick={onGoLogin}
              style={{ background: 'none', border: 'none', color: '#d3101f', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Register;
