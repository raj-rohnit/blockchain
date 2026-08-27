import React, { useState } from 'react';

function shortenHash(hash, len = 10) {
  if (!hash) return '—';
  return hash.length > len ? `${hash.slice(0, len)}…` : hash;
}

function sortByIndex(credentials) {
  return [...credentials].sort((a, b) => a.index - b.index);
}

function getStats(credentials) {
  const total = credentials.length;
  const active = credentials.filter((c) => c.status !== 'revoked').length;
  const revoked = total - active;
  const latest = credentials.reduce(
    (max, c) => (max === null || c.index > max.index ? c : max),
    null
  );
  return { total, active, revoked, latest };
}

function getChainIntegrity(sorted) {
  let broken = 0;
  const brokenAt = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].prevHash !== sorted[i - 1].blockHash) {
      broken += 1;
      brokenAt.push(sorted[i].index);
    }
  }
  return { intact: broken === 0, broken, brokenAt };
}

function statusMeta(status, { isGenesis, brokenLink }) {
  if (brokenLink) return { icon: '✕', label: 'LINK BROKEN', className: 'broken' };
  if (status === 'revoked') return { icon: '⚠', label: 'REVOKED', className: 'revoked' };
  if (isGenesis) return { icon: '◉', label: 'GENESIS', className: 'genesis' };
  return { icon: '✓', label: 'VALID', className: 'active' };
}

function CopyButton({ value, copyKey, copiedKey, onCopy }) {
  const copied = copiedKey === copyKey;
  return (
    <button
      type="button"
      className={`ledger-copy-btn ${copied ? 'copied' : ''}`}
      onClick={() => onCopy(value, copyKey)}
      disabled={!value}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function HashRow({ label, value, copyKey, copiedKey, onCopy }) {
  return (
    <div className="ledger-hash-row">
      <div className="ledger-hash-row-top">
        <span className="label">{label}</span>
        <CopyButton value={value} copyKey={copyKey} copiedKey={copiedKey} onCopy={onCopy} />
      </div>
      <span className="value mono ledger-hash-wrap">{value || '—'}</span>
    </div>
  );
}

export default function HashChainExplorer({ credentials }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [highlightMode, setHighlightMode] = useState(null); // null | 'active' | 'revoked'
  const [copiedKey, setCopiedKey] = useState(null);

  if (!credentials || credentials.length === 0) {
    return (
      <div className="card ledger-explorer">
        <div className="ledger-header">
          <div>
            <h3>Hash-Chain Ledger</h3>
            <p>Every issued credential is cryptographically linked to the previous block.</p>
          </div>
        </div>
        <div className="ledger-empty">
          <span className="ledger-empty-icon">🔗</span>
          <h4>Ledger empty</h4>
          <p>No credentials have been issued yet. Issue your first credential to create the first block.</p>
        </div>
      </div>
    );
  }

  const sorted = sortByIndex(credentials);
  const stats = getStats(credentials);
  const integrity = getChainIntegrity(sorted);

  const selectedPos = sorted.findIndex((c) => c.credentialId === selectedId);
  const hoveredPos = sorted.findIndex((c) => c.credentialId === hoveredId);
  const selected = selectedPos >= 0 ? sorted[selectedPos] : null;
  const previous = selectedPos > 0 ? sorted[selectedPos - 1] : null;
  const isGenesisSelected = selectedPos === 0;
  const linkMatches = selected && previous ? selected.prevHash === previous.blockHash : null;

  function selectBlock(credentialId) {
    setSelectedId((current) => (current === credentialId ? null : credentialId));
  }

  function focusLatest() {
    if (!stats.latest) return;
    setSelectedId(stats.latest.credentialId);
    const el = document.getElementById(`ledger-block-${stats.latest.credentialId}`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function toggleHighlight(mode) {
    setHighlightMode((current) => (current === mode ? null : mode));
  }

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

  return (
    <div className="card ledger-explorer">
      <div className="ledger-header">
        <div>
          <h3>Hash-Chain Ledger</h3>
          <p>Every issued credential is cryptographically linked to the previous block.</p>
        </div>
        <span className={`ledger-integrity-badge ${integrity.intact ? 'intact' : 'warning'}`}>
          {integrity.intact ? '✓ Chain intact' : `⚠ Chain link warning (${integrity.broken})`}
        </span>
      </div>

      <div className="ledger-stats">
        <button
          type="button"
          className={`ledger-stat ledger-stat-btn ${!highlightMode ? 'is-active' : ''}`}
          onClick={() => setHighlightMode(null)}
        >
          <span className="ledger-stat-num">{stats.total}</span>
          <span className="ledger-stat-label">Total blocks</span>
        </button>
        <button
          type="button"
          className={`ledger-stat ledger-stat-btn ${highlightMode === 'active' ? 'is-active' : ''}`}
          onClick={() => toggleHighlight('active')}
        >
          <span className="ledger-stat-num stat-active">{stats.active}</span>
          <span className="ledger-stat-label">Active credentials</span>
        </button>
        <button
          type="button"
          className={`ledger-stat ledger-stat-btn ${highlightMode === 'revoked' ? 'is-active' : ''}`}
          onClick={() => toggleHighlight('revoked')}
        >
          <span className="ledger-stat-num stat-revoked">{stats.revoked}</span>
          <span className="ledger-stat-label">Revoked credentials</span>
        </button>
        <button type="button" className="ledger-stat ledger-stat-btn" onClick={focusLatest} disabled={!stats.latest}>
          <span className="ledger-stat-num">#{stats.latest?.index}</span>
          <span className="ledger-stat-label">Latest block</span>
        </button>
      </div>

      <div className="ledger-track-wrap">
        <div className="ledger-track">
          {sorted.map((c, i) => {
            const isLatest = stats.latest && c.credentialId === stats.latest.credentialId;
            const isSelected = c.credentialId === selectedId;
            const isGenesis = i === 0;
            const brokenLink = i > 0 && c.prevHash !== sorted[i - 1].blockHash;
            const meta = statusMeta(c.status, { isGenesis, brokenLink });

            const isNeighborOfSelected = selectedPos >= 0 && (i === selectedPos - 1 || i === selectedPos + 1);
            const dimmed = selectedPos >= 0 && !isSelected && !isNeighborOfSelected;

            const matchesFilter =
              highlightMode === 'revoked'
                ? c.status === 'revoked'
                : highlightMode === 'active'
                ? c.status !== 'revoked'
                : false;

            const linkActive =
              (selectedPos >= 0 && (i === selectedPos - 1 || i === selectedPos)) ||
              (hoveredPos >= 0 && (i === hoveredPos - 1 || i === hoveredPos));

            return (
              <React.Fragment key={c.credentialId}>
                <button
                  type="button"
                  id={`ledger-block-${c.credentialId}`}
                  className={[
                    'ledger-block',
                    isLatest ? 'ledger-block-latest' : '',
                    isSelected ? 'ledger-block-selected' : '',
                    isLatest && isSelected ? 'ledger-block-latest-selected' : '',
                    meta.className === 'revoked' ? 'ledger-block-revoked' : '',
                    meta.className === 'broken' ? 'ledger-block-broken' : '',
                    dimmed ? 'ledger-block-dim' : '',
                    matchesFilter ? 'ledger-block-filtered' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectBlock(c.credentialId)}
                  onMouseEnter={() => setHoveredId(c.credentialId)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(c.credentialId)}
                  onBlur={() => setHoveredId(null)}
                  aria-pressed={isSelected}
                >
                  <div className="ledger-block-tooltip" role="tooltip">
                    <strong>BLOCK #{c.index}</strong>
                    <span className="mono">{shortenHash(c.blockHash, 14)}</span>
                    <span>{meta.icon} {meta.label}</span>
                  </div>

                  <div className="ledger-block-top">
                    <span className="ledger-block-num">BLOCK #{c.index}</span>
                    {isLatest && <span className="ledger-block-tag">LATEST</span>}
                  </div>
                  <div className="ledger-block-hash mono">{shortenHash(c.blockHash)}</div>
                  <span className={`ledger-block-status status-${meta.className}`}>
                    {meta.icon} {meta.label}
                  </span>
                </button>

                {i < sorted.length - 1 && (
                  <div className={`ledger-link ${linkActive ? 'ledger-link-active' : ''}`}>
                    <div className="ledger-link-line" />
                    <span className="ledger-flow-dot" />
                    <span className="ledger-flow-dot" />
                    <span className="ledger-flow-dot" />
                    <span className="ledger-link-arrow">→</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="ledger-detail anim-fade-up">
          <div className="ledger-detail-header">
            <h4>Block #{selected.index}</h4>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>

          <div className="ledger-detail-section">
            <span className="ledger-detail-section-title">Credential</span>
            <div className="ledger-detail-grid">
              <div className="ledger-detail-field">
                <span className="label">Credential ID</span>
                <span className="value mono">{selected.credentialId}</span>
              </div>
              <div className="ledger-detail-field">
                <span className="label">Student</span>
                <span className="value">{selected.studentName}</span>
              </div>
              <div className="ledger-detail-field">
                <span className="label">Course</span>
                <span className="value">{selected.courseName}</span>
              </div>
              <div className="ledger-detail-field">
                <span className="label">Status</span>
                <span className="value">
                  <span className={`badge ${selected.status === 'revoked' ? 'badge-danger' : 'badge-success'}`}>
                    {selected.status === 'revoked' ? 'Revoked' : 'Active'}
                  </span>
                </span>
              </div>
              <div className="ledger-detail-field">
                <span className="label">Timestamp</span>
                <span className="value">{selected.timestamp || selected.issueDate}</span>
              </div>
            </div>
          </div>

          <div className="ledger-detail-section">
            <span className="ledger-detail-section-title">Ledger data</span>
            <HashRow
              label="Current block hash"
              value={selected.blockHash}
              copyKey={`current-${selected.credentialId}`}
              copiedKey={copiedKey}
              onCopy={copyHash}
            />
            <HashRow
              label="Previous block hash"
              value={selected.prevHash}
              copyKey={`prev-${selected.credentialId}`}
              copiedKey={copiedKey}
              onCopy={copyHash}
            />
            <HashRow
              label="Data hash"
              value={selected.dataHash}
              copyKey={`data-${selected.credentialId}`}
              copiedKey={copiedKey}
              onCopy={copyHash}
            />
          </div>

          <div className="ledger-detail-section">
            <span className="ledger-detail-section-title">Cryptographic link</span>
            {isGenesisSelected ? (
              <div className="ledger-link-check ledger-link-genesis">
                <span className="genesis-tag">◉ GENESIS BLOCK</span>
                <p>This is the first block in the ledger — it has no previous credential block to link to.</p>
              </div>
            ) : (
              <div className="ledger-link-check">
                <div className="ledger-link-flow">
                  <div className="ledger-link-node prev-node">
                    <span className="node-label">PREVIOUS BLOCK #{previous.index} — BLOCK HASH</span>
                    <span className="node-hash mono">{previous.blockHash}</span>
                  </div>
                  <span className="ledger-link-arrow-v">↓</span>
                  <div className="ledger-link-node">
                    <span className="node-label">CURRENT BLOCK #{selected.index} — PREV HASH</span>
                    <span className="node-hash mono">{selected.prevHash || '—'}</span>
                  </div>
                  <span className="ledger-link-arrow-v">↓</span>
                  <div className={`ledger-link-result ${linkMatches ? 'match' : 'mismatch'}`}>
                    {linkMatches ? '✓ CRYPTOGRAPHIC LINK VERIFIED' : '✕ LINK BROKEN'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}