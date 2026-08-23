import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import jsQR from 'jsqr';
import api from '../api.js';

function extractCredentialId(scannedText) {
  const trimmed = scannedText.trim();
  const parts = trimmed.split('/').filter(Boolean);
  return parts[parts.length - 1] || trimmed;
}

function StatusBanner({ result }) {
  if (result.status === 'revoked') {
    return (
      <div className="alert alert-error">
        This credential has been <strong>revoked</strong> by the issuing institution
        {result.revokedReason ? `: ${result.revokedReason}` : '.'}
        {result.revokedAt ? ` (on ${new Date(result.revokedAt).toLocaleDateString()})` : ''}
      </div>
    );
  }
  if (!result.chainIntact) {
    return (
      <div className="alert alert-error">
        Tampering detected — the stored record does not match its cryptographic hash. This credential
        cannot be trusted.
      </div>
    );
  }
  return <div className="alert alert-success">Verified. This credential is authentic and untampered.</div>;
}

export default function Verify() {
  const { credentialId: routeCredentialId } = useParams();
  const [query, setQuery] = useState(routeCredentialId || '');
  const [mode, setMode] = useState('id');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tamperFields, setTamperFields] = useState(null);
  const [tamperResult, setTamperResult] = useState(null);
  const fileInputRef = useRef(null);

  const runVerify = useCallback(async (value, lookupMode) => {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setTamperResult(null);
    try {
      const res = lookupMode === 'hash' ? await api.verifyByHash(value.trim()) : await api.verifyByCredentialId(value.trim());
      setResult(res);
      setTamperFields({
        studentName: res.credential.studentName,
        studentRollNo: res.credential.studentRollNo,
        courseName: res.credential.courseName,
        cgpa: res.credential.cgpa,
        issueDate: res.credential.issueDate,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeCredentialId) {
      setQuery(routeCredentialId);
      setMode('id');
      runVerify(routeCredentialId, 'id');
    }
  }, [routeCredentialId, runVerify]);

  function handleSearch(e) {
    e.preventDefault();
    runVerify(query, mode);
  }

  async function handleQrFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const imageData = await readImageDataFromFile(file);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);
      if (!decoded) {
        setError('Could not read a QR code from that image. Try a clearer photo or enter the ID manually.');
        return;
      }
      const id = extractCredentialId(decoded.data);
      setQuery(id);
      setMode('id');
      runVerify(id, 'id');
    } catch (err) {
      setError('Failed to read image: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleTamperCheck() {
    if (!result) return;
    try {
      const res = await api.tamperCheck(result.credential.credentialId, tamperFields);
      setTamperResult(res);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="verify-page">
      <h1>Verify a Credential</h1>
      <p>Enter a credential ID, paste a block hash, or upload a photo of the QR code from the certificate.</p>

      <div className="verify-tabs">
        <button type="button" className={`verify-tab ${mode === 'id' ? 'active' : ''}`} onClick={() => setMode('id')}>
          Credential ID
        </button>
        <button type="button" className={`verify-tab ${mode === 'hash' ? 'active' : ''}`} onClick={() => setMode('hash')}>
          Block Hash
        </button>
      </div>

      <form onSubmit={handleSearch}>
        <div className="verify-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'id' ? 'e.g. 27f78520-6b5c-469c-923f-bedb2edbf5bb' : 'e.g. 8f52cda5b02ec52067b4e9baa8cc3c26…'}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Checking…' : 'Verify'}
          </button>
        </div>
      </form>

      <div className="qr-scan-drop" onClick={() => fileInputRef.current?.click()}>
        📷 Or click here to upload a QR code image
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQrFile} style={{ display: 'none' }} />
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="result-header">
            <h3>{result.credential.studentName}</h3>
            <span className={`badge ${result.status === 'revoked' ? 'badge-danger' : 'badge-success'}`}>
              {result.status}
            </span>
          </div>

          <StatusBanner result={result} />

          <div className="result-grid">
            <div className="result-field">
              <div className="label">Course / Degree</div>
              <div className="value">{result.credential.courseName}</div>
            </div>
            <div className="result-field">
              <div className="label">Roll No.</div>
              <div className="value">{result.credential.studentRollNo}</div>
            </div>
            <div className="result-field">
              <div className="label">CGPA</div>
              <div className="value">{result.credential.cgpa}</div>
            </div>
            <div className="result-field">
              <div className="label">Issue Date</div>
              <div className="value">{result.credential.issueDate}</div>
            </div>
            <div className="result-field">
              <div className="label">Issuing Institution</div>
              <div className="value">{result.credential.institutionName}</div>
            </div>
            <div className="result-field">
              <div className="label">Chain Block #</div>
              <div className="value">{result.index}</div>
            </div>
          </div>

          <div className="hash-block">
            <div className="label">Block Hash</div>
            <div className="mono">{result.blockHash}</div>
          </div>
          <div className="hash-block">
            <div className="label">Previous Block Hash</div>
            <div className="mono">{result.prevHash}</div>
          </div>

          {!result.chainIntact && result.brokenLinks.length > 0 && (
            <div className="hash-block">
              <div className="label">Broken chain links detected</div>
              <div className="mono">{JSON.stringify(result.brokenLinks, null, 2)}</div>
            </div>
          )}

          <div className="tamper-demo">
            <h4>Try tampering with a field</h4>
            <p>Edit a value below and check it — even a one-character change breaks the hash match instantly.</p>
            <div className="field">
              <label>CGPA</label>
              <div className="form-row">
                <input
                  value={tamperFields?.cgpa ?? ''}
                  onChange={(e) => setTamperFields((f) => ({ ...f, cgpa: e.target.value }))}
                />
                <button className="btn btn-ghost" type="button" onClick={handleTamperCheck}>
                  Check
                </button>
              </div>
            </div>
            {tamperResult && (
              <div className={`alert ${tamperResult.matches ? 'alert-success' : 'alert-error'}`}>
                {tamperResult.matches
                  ? 'Hash matches — this data is exactly what was issued.'
                  : 'Hash mismatch — this data does NOT match the original issued record.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function readImageDataFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
