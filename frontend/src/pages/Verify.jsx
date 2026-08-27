import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import jsQR from 'jsqr';
import api from '../api.js';
import DigitalCertificate from '../components/DigitalCertificate.jsx';

function extractCredentialId(scannedText) {
  const trimmed = scannedText.trim();
  const parts = trimmed.split('/').filter(Boolean);
  return parts[parts.length - 1] || trimmed;
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

  // Loading & Animation states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Tamper Lab states
  const [tamperFields, setTamperFields] = useState(null);
  const [tamperResult, setTamperResult] = useState(null);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [tamperStep, setTamperStep] = useState(0);
  
  const fileInputRef = useRef(null);

  // Progressive loading animation logic for main verification
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
    
    setTamperLoading(true);
    setTamperStep(1);
    setTamperResult(null);
    setError('');

    // Start UI visualization sequence
    const uiInterval = setInterval(() => {
      setTamperStep((s) => (s < 4 ? s + 1 : s));
    }, 400);

    try {
      // Execute the actual existing API check
      const res = await api.tamperCheck(result.credential.credentialId, tamperFields);
      
      // Fast-forward sequence if API returns quickly
      clearInterval(uiInterval);
      setTamperStep(4);
      
      // Slight delay to let step 4 render visually before showing final state
      setTimeout(() => {
        setTamperResult(res);
        setTamperLoading(false);
      }, 300);
    } catch (err) {
      clearInterval(uiInterval);
      setTamperLoading(false);
      setError(err.message);
    }
  }

  function handleResetTamper() {
    if (result) {
      setTamperFields((f) => ({ ...f, cgpa: result.credential.cgpa }));
      setTamperResult(null);
      setTamperStep(0);
      setError('');
    }
  }

  const isVerifiedSuccess = result && result.status !== 'revoked' && result.chainIntact;
  const isDataModified = result && tamperFields && String(tamperFields.cgpa) !== String(result.credential.cgpa);

  return (
    <div className="verify-page">
      <div className="verify-console card no-print">
        <div className="verify-console-header">
          <h1>VERIFY CREDENTIAL</h1>
          <p className="subtitle">Verify the authenticity and integrity of an academic credential against the cryptographic ledger.</p>
        </div>

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
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        <div className="qr-scan-secondary" onClick={() => !loading && fileInputRef.current?.click()}>
          <span className="qr-icon">📷</span> Scan or upload certificate QR
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQrFile} style={{ display: 'none' }} />
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

          {/* TAMPER DETECTION LAB */}
          <div className="tamper-lab card no-print">
            <div className="tamper-lab-header">
              <h2>TAMPER DETECTION LAB</h2>
              <p className="tamper-subtitle">
                Modify a credential field below and see how cryptographic integrity responds in real-time.
              </p>
            </div>

            <div className="tamper-lab-content">
              {/* EDIT SECTION */}
              <div className="tamper-edit-section">
                <div className="tamper-field-row">
                  <div className="tamper-field-box original-box">
                    <span className="tamper-label">ORIGINAL VALUE</span>
                    <span className="tamper-static-val">CGPA: {result.credential.cgpa}</span>
                  </div>
                  
                  <div className="tamper-field-box current-box">
                    <span className="tamper-label">CURRENT VALUE</span>
                    <div className="tamper-input-wrap">
                      <span className="tamper-prefix">CGPA: </span>
                      <input
                        className={`tamper-input ${isDataModified ? 'is-modified' : ''}`}
                        value={tamperFields?.cgpa ?? ''}
                        onChange={(e) => setTamperFields((f) => ({ ...f, cgpa: e.target.value }))}
                        disabled={tamperLoading}
                        aria-label="Edit CGPA"
                      />
                    </div>
                  </div>
                </div>

                {isDataModified && !tamperResult && !tamperLoading && (
                  <div className="tamper-before-after">
                    <div className="ba-col">
                      <span className="ba-label">BEFORE</span>
                      <span className="ba-value">{result.credential.cgpa}</span>
                    </div>
                    <div className="ba-divider">➔</div>
                    <div className="ba-col">
                      <span className="ba-label">AFTER</span>
                      <span className="ba-value">{tamperFields?.cgpa}</span>
                    </div>
                    <div className="ba-warning-badge">
                      <span className="icon">⚠</span> DATA MODIFIED
                    </div>
                  </div>
                )}

                <div className="tamper-actions">
                  <button 
                    className="btn btn-primary btn-tamper-check" 
                    onClick={handleTamperCheck} 
                    disabled={tamperLoading}
                  >
                    {tamperLoading ? 'CHECKING...' : 'CHECK CRYPTOGRAPHIC INTEGRITY'}
                  </button>
                  
                  {isDataModified && (
                    <button 
                      className="btn btn-ghost btn-tamper-reset" 
                      onClick={handleResetTamper} 
                      disabled={tamperLoading}
                    >
                      RESET VALUE
                    </button>
                  )}
                </div>
              </div>

              {/* VERIFICATION ANIMATION */}
              {tamperLoading && (
                <div className="tamper-loading-sequence">
                  <div className={`seq-step ${tamperStep >= 1 ? 'active' : ''}`}>
                    <span className="seq-icon">{tamperStep >= 1 ? '✓' : '○'}</span> STEP 1: Reading credential data
                  </div>
                  <div className={`seq-step ${tamperStep >= 2 ? 'active' : ''}`}>
                    <span className="seq-icon">{tamperStep >= 2 ? '✓' : (tamperStep===1?'◉':'○')}</span> STEP 2: Calculating cryptographic hash
                  </div>
                  <div className={`seq-step ${tamperStep >= 3 ? 'active' : ''}`}>
                    <span className="seq-icon">{tamperStep >= 3 ? '✓' : (tamperStep===2?'◉':'○')}</span> STEP 3: Comparing with issued hash
                  </div>
                  <div className={`seq-step ${tamperStep >= 4 ? 'active' : ''}`}>
                    <span className="seq-icon">{tamperStep >= 4 ? '✓' : (tamperStep===3?'◉':'○')}</span> STEP 4: Checking chain integrity
                  </div>
                </div>
              )}

              {/* RESULT PRESENTATION */}
              {tamperResult && !tamperLoading && (
                <div className={`tamper-result-presentation ${tamperResult.matches ? 'valid-state' : 'tampered-state'}`}>
                  
                  <div className="tamper-status-banner">
                    {tamperResult.matches ? (
                      <>
                        <h3>✓ INTEGRITY VERIFIED</h3>
                        <p>Credential data matches the issued cryptographic record.</p>
                      </>
                    ) : (
                      <>
                        <h3>✕ TAMPER DETECTED</h3>
                        <p>The modified credential data no longer matches the issued cryptographic record.</p>
                      </>
                    )}
                  </div>

                  {/* Hash Comparison (Only shown if API provides hashes) */}
                  {(tamperResult.originalHash || tamperResult.computedHash) && (
                    <div className="tamper-hash-comparison">
                      {tamperResult.originalHash && (
                        <div className="hash-row">
                          <span className="hash-label">ORIGINAL HASH</span>
                          <span className="hash-value mono">{tamperResult.originalHash}</span>
                        </div>
                      )}
                      {tamperResult.computedHash && (
                        <div className="hash-row">
                          <span className="hash-label">CURRENT HASH</span>
                          <span className="hash-value mono">{tamperResult.computedHash}</span>
                        </div>
                      )}
                      <div className={`hash-match-indicator ${tamperResult.matches ? 'match' : 'mismatch'}`}>
                        {tamperResult.matches ? '✓ MATCH' : '✕ MISMATCH'}
                      </div>
                    </div>
                  )}

                  {/* VISUAL FLOW DIAGRAM */}
                  <div className="tamper-flow-diagram">
                    <div className="flow-node">CREDENTIAL DATA</div>
                    <div className={`flow-connector ${tamperResult.matches ? 'pulse' : 'break-first'}`}>
                      {tamperResult.matches ? '↓' : '↓'}
                    </div>
                    <div className="flow-node">DATA HASH</div>
                    <div className={`flow-connector ${tamperResult.matches ? 'pulse' : 'break-core'}`}>
                      {tamperResult.matches ? '↓' : '✕ HASH MISMATCH'}
                    </div>
                    <div className="flow-node">BLOCK HASH</div>
                    <div className={`flow-connector ${tamperResult.matches ? 'pulse' : 'break-cascade'}`}>
                      {tamperResult.matches ? '↓' : '✕'}
                    </div>
                    <div className="flow-node">CHAIN LINK</div>
                    <div className={`flow-connector ${tamperResult.matches ? 'pulse' : 'break-cascade'}`}>
                      {tamperResult.matches ? '↓' : '✕'}
                    </div>
                    <div className={`flow-node final-node ${tamperResult.matches ? 'valid' : 'invalid'}`}>
                      {tamperResult.matches ? '✓ CHAIN VALID' : '✕ CHAIN INTEGRITY FAILURE'}
                    </div>
                  </div>
                  
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