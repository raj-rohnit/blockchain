import * as crypto from 'crypto';

export const GENESIS_HASH = '0'.repeat(64);

// Fields that make up the tamper-evident payload of a credential.
// Anything outside this list (status/revocation metadata) is
// intentionally mutable without breaking the chain, since revocation
// is recorded as its own event rather than an edit to history.
export const CORE_FIELDS = [
  'credentialId',
  'studentName',
  'studentRollNo',
  'courseName',
  'cgpa',
  'issueDate',
  'institutionId',
  'institutionName',
] as const;

export interface CredentialBlock {
  credentialId: string;
  index: number;
  studentName: string;
  studentRollNo: string;
  courseName: string;
  cgpa: string;
  issueDate: string;
  institutionId: string;
  institutionName: string;
  status: string;
  revokedAt: string | null;
  revokedReason: string | null;
  prevHash: string;
  dataHash: string;
  blockHash: string;
  timestamp: string;
}

export type CredentialDraft = Omit<
  CredentialBlock,
  'index' | 'prevHash' | 'dataHash' | 'blockHash' | 'timestamp'
>;

export interface BlockSelfConsistency {
  valid: boolean;
  dataHashValid: boolean;
  blockHashValid: boolean;
  expectedDataHash: string;
  expectedBlockHash: string;
}

export interface BrokenLink {
  index: number;
  reason: 'missing-block' | 'self-hash-mismatch' | 'prev-hash-mismatch';
  details?: BlockSelfConsistency;
  expectedPrevHash?: string;
  actualPrevHash?: string;
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function canonicalize(obj: Record<string, unknown>): string {
  // Stable key order so the same field values always hash the same way.
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export function computeDataHash(credential: Record<string, any>): string {
  const payload: Record<string, unknown> = {};
  for (const field of CORE_FIELDS) {
    payload[field] = credential[field] ?? null;
  }
  return sha256(canonicalize(payload));
}

export function computeBlockHash(params: {
  index: number;
  prevHash: string;
  dataHash: string;
  timestamp: string;
  credentialId: string;
}): string {
  const { index, prevHash, dataHash, timestamp, credentialId } = params;
  return sha256(`${index}|${prevHash}|${dataHash}|${timestamp}|${credentialId}`);
}

/**
 * Builds a new chain block on top of the current chain tip.
 */
export function createBlock(credential: CredentialDraft, chain: CredentialBlock[]): CredentialBlock {
  const index = chain.length;
  const prevHash = index === 0 ? GENESIS_HASH : chain[index - 1].blockHash;
  const timestamp = new Date().toISOString();
  const dataHash = computeDataHash(credential);
  const blockHash = computeBlockHash({
    index,
    prevHash,
    dataHash,
    timestamp,
    credentialId: credential.credentialId,
  });

  return { ...credential, index, prevHash, dataHash, timestamp, blockHash };
}

/**
 * Verifies a single block: recomputes its data hash and block hash from
 * the stored fields and checks they match what's on record. This is what
 * catches a field being edited directly in storage.
 */
export function verifyBlockSelfConsistency(block: CredentialBlock): BlockSelfConsistency {
  const expectedDataHash = computeDataHash(block);
  const dataHashValid = expectedDataHash === block.dataHash;

  const expectedBlockHash = computeBlockHash({
    index: block.index,
    prevHash: block.prevHash,
    dataHash: block.dataHash,
    timestamp: block.timestamp,
    credentialId: block.credentialId,
  });
  const blockHashValid = expectedBlockHash === block.blockHash;

  return {
    valid: dataHashValid && blockHashValid,
    dataHashValid,
    blockHashValid,
    expectedDataHash,
    expectedBlockHash,
  };
}

/**
 * Walks the whole chain from genesis up to (and including) targetIndex,
 * verifying every block's self-consistency AND that each block correctly
 * links to the previous block's hash. This is what catches tampering
 * anywhere upstream in the ledger, not just on the record being checked.
 */
export function verifyChainUpTo(chain: CredentialBlock[], targetIndex: number) {
  const brokenLinks: BrokenLink[] = [];

  for (let i = 0; i <= targetIndex; i++) {
    const block = chain[i];
    if (!block) {
      brokenLinks.push({ index: i, reason: 'missing-block' });
      continue;
    }

    const self = verifyBlockSelfConsistency(block);
    if (!self.valid) {
      brokenLinks.push({ index: i, reason: 'self-hash-mismatch', details: self });
    }

    const expectedPrevHash = i === 0 ? GENESIS_HASH : chain[i - 1].blockHash;
    if (block.prevHash !== expectedPrevHash) {
      brokenLinks.push({
        index: i,
        reason: 'prev-hash-mismatch',
        expectedPrevHash,
        actualPrevHash: block.prevHash,
      });
    }
  }

  return { chainIntact: brokenLinks.length === 0, brokenLinks };
}
