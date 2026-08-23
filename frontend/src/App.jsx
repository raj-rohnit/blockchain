import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Verify from './pages/Verify.jsx';
import BulkVerify from './pages/BulkVerify.jsx';
import './App.css';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }
  return children;
}

export default function App() {
  const { isAuthenticated, institution, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">⛓</span>
          <span>CredentialChain</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/verify" className={({ isActive }) => (isActive ? 'active' : '')}>
            Verify a Credential
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
              <NavLink to="/dashboard/bulk-verify" className={({ isActive }) => (isActive ? 'active' : '')}>
                Bulk Verify
              </NavLink>
              <span className="inst-badge">{institution.name}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                Institution Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary-sm">
                Register Institution
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:credentialId" element={<Verify />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/bulk-verify"
            element={
              <RequireAuth>
                <BulkVerify />
              </RequireAuth>
            }
          />
        </Routes>
      </main>

      <footer className="footer">
        Hash-chain ledger demo · single-node proof of concept for tamper-evident academic credentials
      </footer>
    </div>
  );
}
