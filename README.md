# CredentialChain

**PS-03 — Blockchain-Based Tamper-Proof Academic Credential Verification**

A hash-chain ledger for issuing tamper-evident academic credentials. Institutions issue digitally
signed credential records; employers and verifiers check authenticity instantly via a credential ID,
a block hash, or a QR code — without ever contacting the issuing institution directly.

For a hackathon/internal-round timeline, this deliberately skips standing up a full permissioned
blockchain network. Instead it implements the same tamper-evidence guarantee with a **hash chain**:
every credential is a block that embeds the hash of the block before it, stored on a single Postgres
node. Editing any field in any past record breaks the hash chain instantly and visibly — which is the
property that actually matters for this problem statement.

## Features

- **Institution issuance dashboard** — register an institution, log in, issue credentials one at a
  time or in bulk via CSV upload
- **Hash-chain ledger** — every credential is a block; `blockHash = hash(index, prevHash, dataHash,
  timestamp, credentialId)`, so tampering with any block breaks every block after it
- **Public verification portal** — look up a credential by ID or block hash, or upload a photo of its
  QR code (decoded client-side); shows a live "tamper a field and watch the hash break" demo
- **Bulk CSV issuance** — upload a CSV of students; every row is validated for missing fields, duplicate
  roll numbers within the file, and roll numbers already registered at your institution *before*
  anything touches the database, and the batch is only written if every row is clean
- **Bulk verification** — institution staff can paste a batch of credential IDs / roll numbers and get
  a pass/fail table in one request, useful for admissions offices checking many applicants at once
- **Revocation** — institutions can revoke a credential they issued (fraud, error), recorded as
  metadata on the block rather than rewriting chain history

## Architecture

```
blockchain/
├── docker-compose.yml     # Postgres + Adminer
├── backend/                # NestJS API (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma     # institutions + credentials models (source of truth)
│   │   └── migrations/       # Prisma Migrate history
│   └── src/
│       ├── auth/             # institution register/login, JWT guard
│       ├── credentials/      # issue, list, revoke, bulk CSV validate/commit
│       ├── verify/           # public lookup by ID/hash, bulk verify, tamper-check demo
│       ├── database/         # PrismaService (DI provider)
│       └── common/           # hash-chain logic, QR generation, error filter
└── frontend/                # React + Vite SPA, Tailwind CSS
    └── src/
        ├── pages/             # Home, Login, Register, Dashboard, Verify, BulkVerify
        ├── components/        # BulkUploadPanel
        ├── api.js             # backend API client
        └── AuthContext.jsx    # institution session state
```

**Stack:** PostgreSQL (Docker) · NestJS · Prisma ORM · React + Vite · Tailwind CSS

## How the hash chain works

Each credential is stored as a block with:

- `dataHash` — SHA-256 of the credential's core fields (student name, roll no, course, CGPA, issue
  date, institution)
- `prevHash` — the previous block's `blockHash` (or a genesis hash of all zeros for block 0)
- `blockHash` — SHA-256 of `index | prevHash | dataHash | timestamp | credentialId`

Verifying a credential recomputes `dataHash` and `blockHash` from the stored fields and compares them
to what's on record (catches a field edited directly in the database), **and** walks the entire chain
from genesis up to that block checking every `prevHash` link (catches tampering anywhere upstream,
even in a block nobody directly touched). Revocation is a status flag + timestamp on the block, not a
rewrite of its hashes, so revoked credentials still verify their chain integrity — they just show as
revoked.

## Getting started

### 1. Start the database

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` (empty — Prisma owns the schema, see below) and Adminer — a
web DB browser — on `http://localhost:8080` (system: PostgreSQL, server: `postgres`, user:
`credchain`, password: `credchain_pass`, database: `credential_chain`).

Apply the Prisma migrations to create the tables:

```bash
cd backend && npm run migrate
```

(`npm install` also runs `prisma generate` automatically via a `postinstall` hook. During local
development, `npx prisma migrate dev` creates and applies new migrations when you change
`prisma/schema.prisma`.)

### 2. Start the backend

```bash
cd backend
npm install
npm run start:dev
```

Runs on `http://localhost:4000`, API mounted under `/api`. Copy `.env.example` to `.env` first if you
don't already have one — the defaults match the `docker-compose.yml` Postgres credentials.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. `.env` already points `VITE_API_BASE_URL` at
`http://localhost:4000/api`.

Open `http://localhost:5173`, register an institution, and start issuing credentials.

## API overview

All routes are mounted under `/api`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register an institution, returns a JWT |
| POST | `/auth/login` | — | Log in, returns a JWT |
| POST | `/credentials` | JWT | Issue one credential |
| GET | `/credentials` | JWT | List credentials issued by this institution |
| POST | `/credentials/bulk/validate` | JWT | Upload a CSV, get a per-row validation report (no DB write) |
| POST | `/credentials/bulk/commit` | JWT | Issue a validated batch of rows as sequential chain blocks |
| GET | `/credentials/:id/qr` | JWT | Regenerate the QR code for a credential |
| POST | `/credentials/:id/revoke` | JWT | Revoke a credential |
| GET | `/verify/:credentialId` | — | Public lookup + chain verification by credential ID |
| GET | `/verify/hash/:blockHash` | — | Public lookup + chain verification by block hash |
| POST | `/verify/bulk` | JWT | Verify many credential IDs / roll numbers at once (admissions-style bulk check) |
| POST | `/verify/:credentialId/tamper-check` | — | Recompute the hash for edited field values (demo) |

## Demoing the tamper-proof property

1. Issue a credential from the dashboard and note its verify link / QR code.
2. Verify it on the public portal — shows green, chain intact.
3. In the "Try tampering with a field" box, change the CGPA and click Check — hash mismatch, instant.
4. For the stronger version: edit a field directly in the database (e.g. via Adminer at
   `localhost:8080`) and re-verify *any later-issued* credential — the chain walk will flag the break
   even though that later credential's own row was never touched.
