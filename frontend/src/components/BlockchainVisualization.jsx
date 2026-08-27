import React from 'react';

const blocks = [
  { id: 421, hash: '8f52cda1', prevHash: '00000000', status: 'VALID' },
  { id: 422, hash: '9a3b1c4e', prevHash: '8f52cda1', status: 'VALID' },
  { id: 423, hash: 'e4d81a95', prevHash: '9a3b1c4e', status: 'VALID' },
  { id: 424, hash: '7e2c9d10', prevHash: 'e4d81a95', status: 'VALID' },
  { id: 425, hash: '3a9f1b82', prevHash: '7e2c9d10', status: 'VALID', isLatest: true },
];

export default function BlockchainVisualization() {
  return (
    <div className="chain-visualization-card">
      <div className="chain-header">
        <div className="chain-title-wrap">
          <span className="chain-status-dot"></span>
          <span className="chain-title">CRYPTOGRAPHIC LEDGER</span>
        </div>
        <span className="badge badge-chain">HASH-CHAIN LIVE</span>
      </div>

      <div className="chain-blocks-container">
        {blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            <div
              className={`chain-block-node ${
                block.isLatest ? 'chain-block-latest' : ''
              }`}
            >
              <div className="chain-block-top">
                <span className="chain-block-num">BLOCK #{block.id}</span>
                <span
                  className={`chain-block-badge ${
                    block.isLatest ? 'badge-latest' : 'badge-valid'
                  }`}
                >
                  ✓ {block.isLatest ? 'LATEST BLOCK' : 'VALID'}
                </span>
              </div>
              <div className="chain-block-details">
                <div className="chain-hash-row">
                  <span className="chain-hash-label">HASH:</span>
                  <span className="chain-hash-val">{block.hash}...</span>
                </div>
                <div className="chain-hash-row">
                  <span className="chain-hash-label">PREV:</span>
                  <span className="chain-hash-val">{block.prevHash}...</span>
                </div>
              </div>
            </div>

            {index < blocks.length - 1 && (
              <div className="chain-connector">
                <div className="chain-connector-line"></div>
                <div className="chain-connector-dot"></div>
                <span className="chain-link-label">prev_hash link</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="chain-footer">
        <span>🔒 Immutably linked via SHA-256 cryptographic hash-chain</span>
      </div>
    </div>
  );
}