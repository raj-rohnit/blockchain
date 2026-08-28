import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import BlockchainBackground from '../components/BlockchainBackground.jsx';

function NodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 2v20M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.8-7 9.5-7 9.5 7 9.5 7-3.8 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M6.7 6.9C4.3 8.4 2.5 12 2.5 12s3.8 7 9.5 7c1.7 0 3.2-.5 4.5-1.3M9.9 5.3C10.6 5.1 11.3 5 12 5c5.7 0 9.5 7 9.5 7-.5.9-1.3 2-2.3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2c3 1.2 5 4.3 5 8 0 2-1 4-2 5l-3 3-3-3c-1-1-2-3-2-5 0-3.7 2-6.8 5-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.5 15 6 21l3.5-2M15.5 15 18 21l-3.5-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h16M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5S18.8 16.4 20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DocCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 13.5 11.3 15.3 15 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FingerprintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a8 8 0 0 1 8 8v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 9a3 3 0 0 1 3 3v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 12.5V17a3 3 0 0 0 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 5 5.5v5c0 4.3 2.9 7.5 7 9 4.1-1.5 7-4.7 7-9v-5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m8.5 12 2.4 2.4L15.5 9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register(form);
      login(res.token, res.institution);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page register-page">
      <BlockchainBackground variant="register" />

      <div className="register-node-side" aria-hidden="true">
        <div className="register-node-ring">
          <div className="register-node-cube">
            <span className="cube-link cube-link-tl" />
            <span className="cube-link cube-link-tr" />
            <span className="cube-link cube-link-bl" />
            <span className="cube-link cube-link-br" />
            <span className="cube-dot cube-dot-center" />
            <span className="cube-dot cube-dot-top" />
            <span className="cube-dot cube-dot-left" />
            <span className="cube-dot cube-dot-right" />
            <span className="cube-dot cube-dot-bottom" />
          </div>
        </div>
        <p className="register-node-caption">
          New institution node
          <br />
          joining the network
        </p>
        <div className="register-node-progress">
          <span className="progress-dot" />
          <span className="progress-line" />
          <span className="progress-dot" />
          <span className="progress-line" />
          <span className="progress-dot" />
        </div>
      </div>

      <div className="card auth-card auth-console register-console">
        <div className="console-glow-border" aria-hidden="true" />
        <span className="console-corner console-corner-tl" aria-hidden="true" />
        <span className="console-corner console-corner-tr" aria-hidden="true" />

        <div className="console-header">
          <div className="console-header-top">
            <span className="console-eyebrow">
              <NodeIcon /> SECURE INSTITUTION REGISTRATION
            </span>
            <span className="console-status">
              <span className="console-status-dot" aria-hidden="true" /> LEDGER ONLINE
            </span>
          </div>
          <h2>INITIALIZE INSTITUTION NODE</h2>
          <p className="auth-subtitle">Register your institution to begin issuing cryptographically verifiable credentials.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <fieldset className="auth-section register-identity-section">
            <legend className="auth-section-label">
              <span className="section-icon" aria-hidden="true">◈</span> Institution identity
            </legend>

            <div className="field">
              <label htmlFor="name" className="auth-field-label">Institution name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><BuildingIcon /></span>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="e.g. Indian Institute of Technology"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email" className="auth-field-label">Official institution email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><MailIcon /></span>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="admin@institution.edu"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password" className="auth-field-label">Node access key</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least 6 characters"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-visibility-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide access key' : 'Show access key'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
          </fieldset>

          <button className="btn btn-primary btn-block auth-submit-btn register-submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-scan" aria-hidden="true" /> INITIALIZING...
              </>
            ) : (
              <>
                <span className="btn-icon-left"><RocketIcon /></span>
                <span className="btn-label">INITIALIZE NODE</span>
                <span className="btn-icon-right"><ArrowRightIcon /></span>
              </>
            )}
          </button>
        </form>

        <div className="register-flow" aria-hidden="true">
          <div className="flow-node active">
            <span className="flow-node-circle"><PersonIcon /></span>
            <span className="flow-node-label">Identity</span>
          </div>
          <span className="flow-connector" />
          <div className="flow-node active">
            <span className="flow-node-circle"><DocCheckIcon /></span>
            <span className="flow-node-label">Register</span>
          </div>
          <span className="flow-connector" />
          <div className="flow-node active">
            <span className="flow-node-circle"><FingerprintIcon /></span>
            <span className="flow-node-label">Hash</span>
          </div>
          <span className="flow-connector" />
          <div className="flow-node active">
            <span className="flow-node-circle"><ShieldCheckIcon /></span>
            <span className="flow-node-label">Active</span>
          </div>
        </div>

        <div className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </div>

        <p className="auth-security-footer">
          <span className="footer-bracket footer-bracket-left" aria-hidden="true" />
          <span className="footer-text"><ShieldIcon /> SECURE REGISTRATION • LEDGER CONNECTION ACTIVE</span>
          <span className="footer-bracket footer-bracket-right" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}