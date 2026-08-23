CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each row is one block in the hash chain. chain_index is the block's
-- position; prev_hash must equal the previous block's block_hash (or the
-- genesis hash for index 0). Tampering with any stored field is caught
-- by recomputing data_hash/block_hash and comparing against these columns.
CREATE TABLE IF NOT EXISTS credentials (
  credential_id UUID PRIMARY KEY,
  chain_index INTEGER NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  student_roll_no TEXT NOT NULL,
  course_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  institution_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  prev_hash TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  block_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A roll number identifies one student within one institution; the same
  -- institution can't issue a second credential under a roll number it has
  -- already registered. Different institutions may reuse the same roll no.
  UNIQUE (institution_id, student_roll_no)
);

CREATE INDEX IF NOT EXISTS idx_credentials_institution ON credentials(institution_id);
CREATE INDEX IF NOT EXISTS idx_credentials_block_hash ON credentials(block_hash);
