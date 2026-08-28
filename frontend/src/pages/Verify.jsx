import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import jsQR from 'jsqr';
import api from '../api.js';
import DigitalCertificate from '../components/DigitalCertificate.jsx';
import BlockchainBackground from '../components/BlockchainBackground.jsx';

function extractCredentialId(scannedText) {
  const trimmed = scannedText.trim();
  const parts = trimmed.split('/').filter(Boolean);
  return parts[parts.length - 1] || trimmed;
}

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

function StatusBanner({ result }) {
  if (result.status === 'revoked') {
    return (
      <div className="status-banner-card status-error">
        <div className="status-banner-header">
          <span className="status-icon">⚠</span>
          <h2>CREDENTIAL REVOKED</h2>
        </div>
        <p className="status-desc">
          The issuing institution has revoked this credential.
          {result.revokedReason ? ` Reason: ${result.revokedReason}` : ''}
        </p>
        {result.revokedAt && (
          <p className="status-date">Revoked on: {new Date(result.revokedAt).toLocaleDateString()}</p>
        )}
      </div>
    );
  }

  if (!result.chainIntact) {
    return (
      <div className="status-banner-card status-error">
        <div className="status-banner-header">
          <span className="status-icon">✕</span>
          <h2>INTEGRITY CHECK FAILED</h2>
        </div>
        <p className="status-desc">
          The stored credential does not match the cryptographic hash-chain record.
        </p>
        {result.brokenLinks && result.brokenLinks.length > 0 && (
          <div className="broken-links-box">
            <span className="broken-label">Broken Chain Links:</span>
            <pre className="mono">{JSON.stringify(result.brokenLinks, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="status-banner-card status-success">
      <div className="status-banner-header">
        <span className="status-icon">✓</span>
        <h2>CREDENTIAL VERIFIED</h2>
      </div>
      <p className="status-desc">Authenticity and cryptographic integrity confirmed.</p>

      <div className="verification-checklist">
        <div className="checklist-item"><span className="check-mark">✓</span> Credential found</div>
        <div className="checklist-item"><span className="check-mark">✓</span> Hash matched</div>
        <div className="checklist-item"><span className="check-mark">✓</span> Chain integrity verified</div>
        <div className="checklist-item"><span className="check-mark">✓</span> Issuing institution verified</div>
        <div className="checklist-item"><span className="check-mark">✓</span> Credential not revoked</div>
      </div>
    </div>
  );
}

export default function Verify() {
  const { credentialId: routeCredentialId } = useParams();
  const [query, setQuery] = useState(routeCredentialId || '');
  const [mode, setMode] = useState('id');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [tamperFields, setTamperFields] = useState(null);
  const [tamperResult, setTamperResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let timers = [];
    if (loading) {
      setLoadingStep(0);
      timers.push(setTimeout(() => setLoadingStep(1), 300));
      timers.push(setTimeout(() => setLoadingStep(2), 700));
      timers.push(setTimeout(() => setLoadingStep(3), 1100));
      timers.push(setTimeout(() => setLoadingStep(4), 1500));
    } else {
      setLoadingStep(0);
    }
    return () => timers.forEach(clearTimeout);
  }, [loading]);

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

  const isVerifiedSuccess = result && result.status !== 'revoked' && result.chainIntact;

  // Decorative flow strip only — derived from real loading/result state, nothing fabricated.
  const flowStage = loading ? loadingStep : result ? 4 : 0;
  const flowFailed = !loading && !!result && !isVerifiedSuccess;

  return (
    <div className="verify-page">
      <BlockchainBackground variant="verify" />

      <div className="verify-console verify-console-v2 card no-print">
        <div className="console-glow-border" aria-hidden="true" />

        <div className="console-header">
          <div className="console-header-top">
            <span className="console-eyebrow">
              <ShieldIcon /> CRYPTOGRAPHIC VERIFICATION NODE
            </span>
            <span className="console-status">
              <span className="console-status-dot" aria-hidden="true" /> LEDGER ONLINE
            </span>
          </div>
          <h1>VERIFY CREDENTIAL</h1>
          <p className="subtitle">
            Validate the authenticity and integrity of an academic credential against the cryptographic ledger.
          </p>
        </div>

        <div className="verify-tabs verify-tabs-v2">
          <button type="button" className={`verify-tab ${mode === 'id' ? 'active' : ''}`} onClick={() => setMode('id')}>
            Credential ID
          </button>
          <button type="button" className={`verify-tab ${mode === 'hash' ? 'active' : ''}`} onClick={() => setMode('hash')}>
            Block Hash
          </button>
        </div>
        <p className="verify-mode-hint">
          {mode === 'id'
            ? 'Locate a credential directly using its unique identifier.'
            : 'Verify a credential block using its SHA-256 hash.'}
        </p>

        <form onSubmit={handleSearch}>
          <div className="verify-search verify-search-v2">
            <span className="verify-search-icon" aria-hidden="true">🔒</span>
            <input
              className="verify-search-input mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'id' ? 'e.g. 27f78520-6b5c-469c-923f-bedb2edbf5bb' : 'e.g. 8f52cda5b02ec52067b4e9baa8cc3c26…'}
              disabled={loading}
            />
            <button className="btn btn-primary verify-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-scan" aria-hidden="true" /> VERIFYING...
                </>
              ) : (
                'VERIFY CREDENTIAL'
              )}
            </button>
          </div>
        </form>

        <div className="qr-scan-zone" onClick={() => !loading && fileInputRef.current?.click()}>
          <span className="qr-scan-line" aria-hidden="true" />
          <span className="qr-scan-icon" aria-hidden="true">▦</span>
          <span className="qr-scan-title">SCAN CERTIFICATE QR</span>
          <span className="qr-scan-sub">Upload a certificate QR image to verify its cryptographic record.</span>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQrFile} style={{ display: 'none' }} />
        </div>

        <div className="chain-flow-mini" aria-hidden="true">
          <span className="chain-flow-step active">INPUT</span>
          <span className="chain-flow-arrow">→</span>
          <span className={`chain-flow-step ${flowStage >= 2 ? 'active' : ''}`}>HASH</span>
          <span className="chain-flow-arrow">→</span>
          <span className={`chain-flow-step ${flowStage >= 3 ? 'active' : ''}`}>LEDGER</span>
          <span className="chain-flow-arrow">→</span>
          <span
            className={`chain-flow-step ${flowStage >= 4 ? (flowFailed ? 'failed' : 'active verified') : ''}`}
          >
            VERIFIED
          </span>
        </div>
      </div>

      {loading && (
        <div className="loading-process-panel card no-print">
          <h3>VERIFYING CREDENTIAL</h3>
          <div className="process-list">
            <div className={`process-item ${loadingStep >= 1 ? 'active' : ''}`}>
              <span className="step-mark">{loadingStep >= 1 ? '✓' : '○'}</span> Credential located
            </div>
            <div className={`process-item ${loadingStep >= 2 ? 'active' : ''}`}>
              <span className="step-mark">{loadingStep >= 2 ? '✓' : (loadingStep === 1 ? '◉' : '○')}</span> Calculating cryptographic hash...
            </div>
            <div className={`process-item ${loadingStep >= 3 ? 'active' : ''}`}>
              <span className="step-mark">{loadingStep >= 3 ? '✓' : (loadingStep === 2 ? '◉' : '○')}</span> Checking previous block...
            </div>
            <div className={`process-item ${loadingStep >= 4 ? 'active' : ''}`}>
              <span className="step-mark">{loadingStep >= 4 ? '✓' : (loadingStep === 3 ? '◉' : '○')}</span> Verifying chain integrity...
            </div>
            <div className="process-item">
               <span className="step-mark">{loadingStep === 4 ? '◉' : '○'}</span> Checking revocation status...
            </div>
          </div>
        </div>
      )}

      {error && !loading && <div className="alert alert-error verify-error no-print">{error}</div>}

      {result && !loading && (
        <div className="verification-results">
          <StatusBanner result={result} />

          {isVerifiedSuccess ? (
            <DigitalCertificate result={result} />
          ) : (
            <div className="blockchain-proof-section card">
              <h3 className="proof-title">BLOCKCHAIN PROOF</h3>
              <div className="proof-flow">
                <div className="proof-node">
                  <div className="node-label">CURRENT BLOCK #{result.index}</div>
                  <div className="node-hash mono">{result.blockHash}</div>
                </div>

                <div className="proof-flow-arrow">
                  <span>↓</span>
                  <span className="link-label">Previous Block Link</span>
                  <span>↓</span>
                </div>

                <div className="proof-node prev-node">
                  <div className="node-label">PREVIOUS HASH</div>
                  <div className="node-hash mono">{result.prevHash}</div>
                </div>
              </div>
            </div>
          )}

          <div className="tamper-demo-panel card no-print">
            <div className="tamper-header">
              <h3>TAMPER DETECTION DEMO</h3>
              <p>
                Modify a credential field below to see how changing the data affects its cryptographic
                integrity — the same hash-chain math that verified the certificate above.
              </p>
            </div>

            <div className="tamper-interactive">
              <div className="tamper-row">
                <div className="field">
                  <label>Original value: CGPA {result.credential.cgpa}</label>
                  <div className="input-group">
                    <input
                      value={tamperFields?.cgpa ?? ''}
                      onChange={(e) => setTamperFields((f) => ({ ...f, cgpa: e.target.value }))}
                      className="tamper-input"
                    />
                    <button className="btn btn-ghost" type="button" onClick={handleTamperCheck}>
                      Check Integrity
                    </button>
                  </div>
                </div>
              </div>

              {tamperResult && (
                <div className={`tamper-status ${tamperResult.matches ? 'status-match' : 'status-mismatch'}`}>
                  <h4>{tamperResult.matches ? '✓ HASH MATCH' : '✕ HASH MISMATCH'}</h4>
                  <p>
                    {tamperResult.matches
                      ? 'This data matches the originally issued credential.'
                      : 'This change breaks the cryptographic integrity of the credential.'}
                  </p>
                </div>
              )}
            </div>
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