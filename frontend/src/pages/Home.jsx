import { Link } from 'react-router-dom';
import BlockchainVisualization from '../components/BlockchainVisualization';

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="status-dot status-dot--chain"></span>
            CRYPTOGRAPHIC LEDGER VERIFICATION
          </div>
          <h1>Tamper-proof academic credentials, verified in seconds.</h1>
          <p>
            Institutions issue digitally hash-chained credentials. Employers and recruiters verify
            authenticity instantly via QR code or credential ID — no phone calls to the registrar required.
          </p>
          <div className="hero-actions">
            <Link to="/verify" className="btn btn-primary">
              Verify a Credential
            </Link>
            <Link to="/register" className="btn btn-ghost">
              Register your Institution
            </Link>
          </div>
        </div>

        <div className="hero-visualization">
          <BlockchainVisualization />
        </div>
      </section>

      <div className="feature-grid">
        <div className="card feature-card">
          <h3>Hash-Chain Ledger</h3>
          <p>Every credential is a block linked to the one before it, so any edit to any field breaks the chain instantly and visibly.</p>
        </div>
        <div className="card feature-card">
          <h3>QR / Hash Lookup</h3>
          <p>Each credential gets a QR code and a unique ID. Anyone can verify it on the public portal without an account.</p>
        </div>
        <div className="card feature-card">
          <h3>Revocation Handling</h3>
          <p>Institutions can revoke credentials issued in error or found to be fraudulent — revocation is reflected immediately on verification.</p>
        </div>
      </div>

      <section className="how-it-works card">
        <h2>How it works</h2>
        <div className="step-list">
          <div className="step-item">
            <div className="step-num">1</div>
            <div>
              <h4>Institution issues</h4>
              <p>A registered institution fills in student and course details on the dashboard.</p>
            </div>
          </div>
          <div className="step-item step-item--highlight">
            <div className="step-num">2</div>
            <div>
              <h4>Chain block created</h4>
              <p>The record is hashed together with the previous block's hash and stored immutably in the cryptographic ledger.</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-num">3</div>
            <div>
              <h4>QR code generated</h4>
              <p>A QR code and shareable link are generated, ready to print on the certificate.</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-num">4</div>
            <div>
              <h4>Instant verification</h4>
              <p>Anyone scans the QR or enters the ID on the public portal to see live, cryptographic blockchain proof of authenticity.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}