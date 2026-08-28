import { Link } from 'react-router-dom';
import BlockchainBackground from '../components/BlockchainBackground';

/* Decorative hash fragments — not real ledger records. */
const DECOR_HASHES = ['a91be4…', 'b4c82a…', '7e29e7…'];

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="chv-shield">
      <path
        d="M12 2.5 4.5 5.6v6c0 4.4 3.1 8.4 7.5 9.9 4.4-1.5 7.5-5.5 7.5-9.9v-6L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="m8.6 12.1 2.3 2.4 4.5-4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="chain-hero-visual" aria-hidden="true">
      <svg className="chv-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <g className="chv-rings">
          <ellipse cx="200" cy="200" rx="150" ry="150" />
          <ellipse cx="200" cy="200" rx="118" ry="118" />
          <ellipse cx="200" cy="200" rx="184" ry="184" />
        </g>
        <g className="chv-links">
          <line x1="200" y1="200" x2="200" y2="72" />
          <line x1="200" y1="200" x2="78" y2="256" />
          <line x1="200" y1="200" x2="322" y2="238" />
        </g>
        <g className="chv-orbit-dots">
          <circle cx="350" cy="200" r="3" />
          <circle cx="50" cy="200" r="3" />
          <circle cx="200" cy="16" r="2.5" />
        </g>
      </svg>

      <div className="chv-core">
        <div className="chv-core-face">
          <ShieldCheck />
          <span className="chv-core-label">VERIFIED</span>
        </div>
      </div>

      <div className="chv-node chv-node--top">
        <span className="chv-node-bar" />
        <span className="chv-node-bar chv-node-bar--short" />
      </div>
      <div className="chv-node chv-node--left">
        <span className="chv-node-bar" />
        <span className="chv-node-bar chv-node-bar--short" />
      </div>
      <div className="chv-node chv-node--right">
        <span className="chv-node-bar" />
        <span className="chv-node-bar chv-node-bar--short" />
      </div>

      {DECOR_HASHES.map((h, i) => (
        <span key={h} className={`chv-hash chv-hash--${i + 1}`}>
          {h}
        </span>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    title: 'Tamper-Evident',
    body: 'Any edit to a stored record breaks its cryptographic hash, visibly.',
    icon: (
      <path
        d="M12 3 5 6v5.5c0 4 2.9 7.7 7 9 4.1-1.3 7-5 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Publicly Verifiable',
    body: 'Anyone can check a credential without an account or a phone call.',
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Instant Verification',
    body: 'Confirm authenticity in seconds instead of waiting on a registrar.',
    icon: (
      <path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Revocable',
    body: 'Institutions can revoke a credential without rewriting chain history.',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m6.5 6.5 11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Institution Issues',
    body: 'A registered institution enters the student and course details on its dashboard.',
  },
  {
    n: '02',
    title: 'Chain Block Created',
    body: "The record is hashed together with the previous block's hash and appended to the ledger.",
  },
  {
    n: '03',
    title: 'QR Code Generated',
    body: 'A QR code and shareable link are produced, ready to print on the certificate.',
  },
  {
    n: '04',
    title: 'Instant Verification',
    body: 'Anyone scans the QR or enters the ID to see live cryptographic proof of authenticity.',
  },
];

export default function Home() {
  return (
    <>
      <BlockchainBackground variant="register" />

      <div className="home-page">
        <section className="hero">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="status-dot status-dot--chain" />
              CRYPTOGRAPHIC LEDGER VERIFICATION
            </div>

            <h1 className="hero-title">
              Secure. Verify.
              <br />
              <span className="hero-title-accent">Trust Forever.</span>
            </h1>

            <p>
              CredentialChain issues and verifies academic credentials on a cryptographic
              hash-chain ledger. Every record is mathematically linked to the one before it, so
              tampering is immediately visible to anyone who checks.
            </p>

            <div className="hero-actions">
              <Link to="/verify" className="btn btn-primary btn-hero">
                Verify a Credential
                <span className="btn-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link to="/register" className="btn btn-ghost btn-hero">
                Register Your Institution
              </Link>
            </div>
          </div>

          <div className="hero-visualization">
            <HeroVisual />
          </div>
        </section>

        <section className="feature-strip" aria-label="Platform capabilities">
          {FEATURES.map((f) => (
            <div className="feature-strip-item" key={f.title}>
              <span className="feature-strip-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">{f.icon}</svg>
              </span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="how-it-works">
          <div className="how-header">
            <span className="how-rule" aria-hidden="true" />
            <h2>
              How <span className="hero-title-accent">CredentialChain</span> Works
            </h2>
            <p>A secure and transparent workflow for academic credentials.</p>
          </div>

          <ol className="step-list">
            {STEPS.map((s, i) => (
              <li className="step-item" key={s.n}>
                <div className="step-node">
                  <span className="step-num">{s.n}</span>
                  {i < STEPS.length - 1 && <span className="step-connector" aria-hidden="true" />}
                </div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}