import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import BlockchainBackground from '../components/BlockchainBackground.jsx';

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      const res = await api.login(form);
      login(res.token, res.institution);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <BlockchainBackground variant="login" />

      <div className="card auth-card auth-console">
        <div className="console-glow-border" aria-hidden="true" />

        <div className="console-header">
          <div className="console-header-top">
            <span className="console-eyebrow">
              <ShieldIcon /> SECURE INSTITUTION NODE
            </span>
            <span className="console-status">
              <span className="console-status-dot" aria-hidden="true" /> LEDGER ONLINE
            </span>
          </div>
          <h2>INSTITUTION AUTHENTICATION</h2>
          <p className="auth-subtitle">Authenticate your institution to access the credential issuance ledger.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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
            <label htmlFor="password" className="auth-field-label">Secure access key</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className="auth-input"
              />
            </div>
          </div>

          <button className="btn btn-primary btn-block auth-submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-scan" aria-hidden="true" /> AUTHENTICATING...
              </>
            ) : (
              'AUTHENTICATE NODE'
            )}
          </button>
        </form>

        <div className="chain-flow-mini auth-flow hash-scanning" aria-hidden="true">
          <span className="chain-flow-step active">IDENTITY</span>
          <span className="chain-flow-arrow">→</span>
          <span className="chain-flow-step active">ENCRYPT</span>
          <span className="chain-flow-arrow">→</span>
          <span className="chain-flow-step active">LEDGER</span>
          <span className="chain-flow-arrow">→</span>
          <span className="chain-flow-step active">ACCESS</span>
        </div>

        <div className="auth-switch">
          New institution? <Link to="/register">Register here</Link>
        </div>

        <p className="auth-security-footer">SECURE LEDGER ACCESS • ENCRYPTED CONNECTION</p>
      </div>
    </div>
  );
}