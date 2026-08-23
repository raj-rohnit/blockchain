import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Register your Institution</h2>
        <p className="auth-subtitle">Create an account to start issuing tamper-proof credentials.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Institution name</label>
            <input id="name" required value={form.name} onChange={update('name')} placeholder="e.g. Indian Institute of Technology" />
          </div>
          <div className="field">
            <label htmlFor="email">Official email</label>
            <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="admin@institution.edu" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
