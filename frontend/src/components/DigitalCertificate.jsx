import { useState } from 'react';

function shortenHash(hash, len = 20) {
  if (!hash) return '—';
  return hash.length > len ? `${hash.slice(0, len)}…` : hash;
}

function CopyButton({ value, copyKey, copiedKey, onCopy, label = 'Copy' }) {
  const copied = copiedKey === copyKey;
  return (
    <button
      type="button"
      className={`cert-copy-btn ${copied ? 'copied' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onCopy(value, copyKey);
      }}
      disabled={!value}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

function HashPanel({ label, value, copyKey, copiedKey, onCopy, expanded, onToggle, order }) {
  return (
    <div className={`cert-hash-panel ${expanded ? 'expanded' : ''}`} style={{ animationDelay: `${order * 0.08}s` }}>
      <button
        type="button"
        className="cert-hash-panel-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="cert-hash-panel-label">{label}</span>
        <span className="cert-hash-panel-preview mono">{shortenHash(value)}</span>
        <span className="cert-hash-panel-chevron" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="cert-hash-panel-full">
          <span className="cert-hash-value mono">{value || '—'}</span>
          <CopyButton value={value} copyKey={copyKey} copiedKey={copiedKey} onCopy={onCopy} />
        </div>
      )}
    </div>
  );
}

export default function DigitalCertificate({ result }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [expanded, setExpanded] = useState({ current: false, prev: false, data: false });

  if (!result || !result.credential) return null;

  const c = result.credential;
  const chainOk = result.chainIntact !== false;
  const notRevoked = result.status !== 'revoked';

  function copyHash(value, key) {
    if (!value || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedKey(key);
        window.setTimeout(() => {
          setCopiedKey((k) => (k === key ? null : k));
        }, 1500);
      })
      .catch(() => {});
  }

  function toggle(key) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

  function handlePrint() {
    window.print();
  }

  const fields = [
    { label: 'Roll No.', value: c.studentRollNo },
    { label: 'CGPA', value: c.cgpa },
    { label: 'Issue Date', value: c.issueDate },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  const indicators = [
    { label: 'CREDENTIAL FOUND', ok: true },
    { label: chainOk ? 'HASH VERIFIED' : 'HASH MISMATCH', ok: chainOk },
    { label: chainOk ? 'CHAIN INTACT' : 'CHAIN INTEGRITY FAILED', ok: chainOk },
    { label: notRevoked ? 'NOT REVOKED' : 'REVOKED', ok: notRevoked, warnOnFail: true },
  ];

  return (
    <div className="cert-wrap">
      <div className="cert-actions no-print">
        <button type="button" className="btn btn-ghost btn-sm" onClick={handlePrint}>
          🖨 Download / print credential
        </button>
      </div>

      <div className="digital-certificate card anim-cert-in" id="digital-certificate-print">
        <span className="cert-corner cert-corner-tl" aria-hidden="true" />
        <span className="cert-corner cert-corner-tr" aria-hidden="true" />
        <span className="cert-corner cert-corner-bl" aria-hidden="true" />
        <span className="cert-corner cert-corner-br" aria-hidden="true" />
        <span className="cert-watermark" aria-hidden="true">CREDENTIALCHAIN</span>

        <div className="cert-inner">
          <div className="cert-brand">
            <span className="cert-brand-mark">🔗</span>
            <span className="cert-brand-name">CREDENTIALCHAIN</span>
          </div>
          <div className="cert-kicker">Verified academic credential</div>

          <h2 className="cert-student-name anim-cert-detail" style={{ animationDelay: '0.15s' }}>
            {c.studentName}
          </h2>
          {c.courseName && (
            <div className="cert-course anim-cert-detail" style={{ animationDelay: '0.22s' }}>
              {c.courseName}
            </div>
          )}
          {c.institutionName && (
            <div className="cert-institution anim-cert-detail" style={{ animationDelay: '0.28s' }}>
              Issued by {c.institutionName}
            </div>
          )}

          {fields.length > 0 && (
            <div className="cert-fields anim-cert-detail" style={{ animationDelay: '0.34s' }}>
              {fields.map((f) => (
                <div className="cert-field" key={f.label}>
                  <span className="cert-field-label">{f.label}</span>
                  <span className="cert-field-value mono">{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {c.credentialId && (
            <div className="cert-id-block anim-cert-detail" style={{ animationDelay: '0.4s' }}>
              <span className="cert-id-label">Credential ID</span>
              <span className="cert-id-value mono">{c.credentialId}</span>
              <CopyButton
                value={c.credentialId}
                copyKey="credential-id"
                copiedKey={copiedKey}
                onCopy={copyHash}
                label="Copy ID"
              />
              <p className="cert-id-note">
                This is the public reference used to re-verify this credential on the verification page.
              </p>
            </div>
          )}

          <div className="cert-trust-row anim-cert-detail" style={{ animationDelay: '0.46s' }}>
            {indicators.map((ind) => (
              <span
                key={ind.label}
                className={`cert-indicator ${ind.ok ? 'ok' : ind.warnOnFail ? 'warn' : 'fail'}`}
              >
                {ind.ok ? '✓' : ind.warnOnFail ? '⚠' : '✕'} {ind.label}
              </span>
            ))}
          </div>

          <div className="cert-seal-wrap anim-cert-detail" style={{ animationDelay: '0.05s' }}>
            <div className="cert-seal" title="Cryptographically verified credential">
              <span className="cert-seal-ring" aria-hidden="true" />
              <span className="cert-seal-icon">✓</span>
              <span className="cert-seal-text">
                Authentic credential
                <small>Cryptographically verified</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="blockchain-proof-section card anim-proof-in">
        <h3 className="proof-title">BLOCKCHAIN PROOF</h3>

        <div className="cert-block-badge">
          <span className="cert-block-label">LEDGER POSITION</span>
          <span className="cert-block-num">BLOCK #{result.index}</span>
          {result.isLatest && <span className="cert-block-latest-tag">LATEST BLOCK</span>}
        </div>

        <div className="cert-hash-panels">
          <HashPanel
            label="Current block hash"
            value={result.blockHash}
            copyKey="current"
            copiedKey={copiedKey}
            onCopy={copyHash}
            expanded={expanded.current}
            onToggle={() => toggle('current')}
            order={0}
          />
          <HashPanel
            label="Previous block hash"
            value={result.prevHash}
            copyKey="prev"
            copiedKey={copiedKey}
            onCopy={copyHash}
            expanded={expanded.prev}
            onToggle={() => toggle('prev')}
            order={1}
          />
          {result.dataHash && (
            <HashPanel
              label="Data hash"
              value={result.dataHash}
              copyKey="data"
              copiedKey={copiedKey}
              onCopy={copyHash}
              expanded={expanded.data}
              onToggle={() => toggle('data')}
              order={2}
            />
          )}
        </div>

        <div className="cert-link-check">
          <span className="cert-link-check-title">Cryptographic link</span>

          <div className="cert-link-flow-v">
            <div className="cert-link-node">
              <span className="node-label">PREVIOUS BLOCK HASH</span>
              <span className="node-hash mono">{shortenHash(result.prevHash, 28)}</span>
            </div>

            <div className="cert-link-arrow-v-wrap">
              <span className="cert-link-arrow-v" aria-hidden="true">▼</span>
              {chainOk && <span className="cert-link-pulse" aria-hidden="true" />}
            </div>

            <div className="cert-link-node cert-link-node-current">
              <span className="node-label">CURRENT BLOCK #{result.index}</span>
              <span className="node-hash mono">{shortenHash(result.blockHash, 28)}</span>
            </div>

            <div className="cert-link-arrow-v-wrap">
              <span className="cert-link-arrow-v" aria-hidden="true">▼</span>
              {chainOk && <span className="cert-link-pulse" aria-hidden="true" />}
            </div>

            <div className={`cert-link-result ${chainOk ? 'match' : 'mismatch'}`}>
              {chainOk ? '✓ CRYPTOGRAPHIC LINK VERIFIED' : '✕ HASH-CHAIN LINK BROKEN'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}