import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import BulkUploadPanel from '../components/BulkUploadPanel.jsx';

const emptyForm = { studentName: '', studentRollNo: '', courseName: '', cgpa: '', issueDate: '' };

function StatusBadge({ status }) {
  return status === 'revoked' ? (
    <span className="badge badge-danger">Revoked</span>
  ) : (
    <span className="badge badge-success">Active</span>
  );
}

function QrModal({ qr, onClose }) {
  if (!qr) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Credential issued</h3>
        <div className="qr-preview">
          <img src={qr.qrCodeDataUrl} alt="Verification QR code" />
          <p className="mono">{qr.verifyUrl}</p>
        </div>
        <div className="modal-close-row">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { institution } = useAuth();
  const [issueMode, setIssueMode] = useState('single');
  const [form, setForm] = useState(emptyForm);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [issuedQr, setIssuedQr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function loadCredentials() {
    setLoading(true);
    try {
      const res = await api.listCredentials();
      setCredentials(res.credentials);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleIssue(e) {
    e.preventDefault();
    setError('');
    setIssuing(true);
    try {
      const res = await api.issueCredential(form);
      setForm(emptyForm);
      setIssuedQr({ qrCodeDataUrl: res.qrCodeDataUrl, verifyUrl: res.verifyUrl });
      await loadCredentials();
    } catch (err) {
      setError(err.message);
    } finally {
      setIssuing(false);
    }
  }

  async function handleShowQr(credentialId) {
    setBusyId(credentialId);
    try {
      const res = await api.getCredentialQr(credentialId);
      setIssuedQr(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(credentialId) {
    const reason = window.prompt('Reason for revocation (e.g. issued in error, fraud detected):');
    if (reason === null) return;
    setBusyId(credentialId);
    try {
      await api.revokeCredential(credentialId, reason);
      await loadCredentials();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>{institution.name}</h1>
        <p>Issue new credentials and manage the ones you've already put on the chain.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="card">
          <div className="verify-tabs">
            <button
              type="button"
              className={`verify-tab ${issueMode === 'single' ? 'active' : ''}`}
              onClick={() => setIssueMode('single')}
            >
              Single credential
            </button>
            <button
              type="button"
              className={`verify-tab ${issueMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setIssueMode('bulk')}
            >
              Bulk upload (CSV)
            </button>
          </div>

          {issueMode === 'single' ? (
            <form onSubmit={handleIssue}>
              <div className="field">
                <label htmlFor="studentName">Student name</label>
                <input id="studentName" required value={form.studentName} onChange={update('studentName')} placeholder="Rahul Sharma" />
              </div>
              <div className="field">
                <label htmlFor="studentRollNo">Roll / registration no.</label>
                <input id="studentRollNo" required value={form.studentRollNo} onChange={update('studentRollNo')} placeholder="CS2021045" />
              </div>
              <div className="field">
                <label htmlFor="courseName">Course / degree</label>
                <input id="courseName" required value={form.courseName} onChange={update('courseName')} placeholder="B.Tech Computer Science" />
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="cgpa">Overall CGPA</label>
                  <input id="cgpa" required value={form.cgpa} onChange={update('cgpa')} placeholder="8.7" />
                </div>
                <div className="field">
                  <label htmlFor="issueDate">Issue date</label>
                  <input id="issueDate" type="date" required value={form.issueDate} onChange={update('issueDate')} />
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={issuing}>
                {issuing && <span className="spinner" />}
                {issuing ? 'Issuing…' : 'Issue credential'}
              </button>
            </form>
          ) : (
            <BulkUploadPanel onIssued={loadCredentials} />
          )}
        </div>

        <div className="card">
          <h3>Issued credentials ({credentials.length})</h3>
          {loading ? (
            <p>Loading…</p>
          ) : credentials.length === 0 ? (
            <p>No credentials issued yet. Use the form to issue your first one.</p>
          ) : (
            <div className="credential-list">
              {credentials.map((c) => (
                <div className="credential-item" key={c.credentialId}>
                  <div className="meta">
                    <h4>{c.studentName}</h4>
                    <div className="sub">
                      {c.courseName} · {c.studentRollNo} · CGPA {c.cgpa}
                    </div>
                    <div className="sub">Issued {c.issueDate} · Block #{c.index}</div>
                    <div className="hash mono">{c.blockHash.slice(0, 24)}…</div>
                  </div>
                  <div className="credential-actions">
                    <StatusBadge status={c.status} />
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                      onClick={() => handleShowQr(c.credentialId)}
                      disabled={busyId === c.credentialId}
                    >
                      QR code
                    </button>
                    {c.status !== 'revoked' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                        onClick={() => handleRevoke(c.credentialId)}
                        disabled={busyId === c.credentialId}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QrModal qr={issuedQr} onClose={() => setIssuedQr(null)} />
    </div>
  );
}
