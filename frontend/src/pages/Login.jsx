import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

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
      <div className="card auth-card">
        <h2>Institution Login</h2>
        <p className="auth-subtitle">Sign in to issue and manage credentials.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="admin@institution.edu" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={form.password} onChange={update('password')} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-switch">
          New institution? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
