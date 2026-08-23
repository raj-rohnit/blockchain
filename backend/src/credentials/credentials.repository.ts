import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CredentialBlock, CredentialDraft, createBlock } from '../common/hash-chain/hash-chain';

type Db = PrismaService | Prisma.TransactionClient;

function rowToBlock(row: {
  credentialId: string;
  chainIndex: number;
  studentName: string;
  studentRollNo: string;
  courseName: string;
  cgpa: string;
  issueDate: string;
  institutionId: string;
  institutionName: string;
  status: string;
  revokedAt: Date | null;
  revokedReason: string | null;
  prevHash: string;
  dataHash: string;
  blockHash: string;
  blockTimestamp: Date;
}): CredentialBlock {
  return {
    credentialId: row.credentialId,
    index: row.chainIndex,
    studentName: row.studentName,
    studentRollNo: row.studentRollNo,
    courseName: row.courseName,
    cgpa: row.cgpa,
    issueDate: row.issueDate,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    status: row.status,
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    revokedReason: row.revokedReason,
    prevHash: row.prevHash,
    dataHash: row.dataHash,
    blockHash: row.blockHash,
    timestamp: row.blockTimestamp.toISOString(),
  };
}

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFullChain(client: Db = this.prisma): Promise<CredentialBlock[]> {
    const rows = await client.credential.findMany({ orderBy: { chainIndex: 'asc' } });
    return rows.map(rowToBlock);
  }

  async getByInstitution(institutionId: string): Promise<CredentialBlock[]> {
    const rows = await this.prisma.credential.findMany({
      where: { institutionId },
      orderBy: { chainIndex: 'desc' },
    });
    return rows.map(rowToBlock);
  }

  async getById(credentialId: string): Promise<CredentialBlock | null> {
    const row = await this.prisma.credential.findUnique({ where: { credentialId } });
    return row ? rowToBlock(row) : null;
  }

  async getByBlockHash(blockHash: string): Promise<CredentialBlock | null> {
    const row = await this.prisma.credential.findFirst({ where: { blockHash } });
    return row ? rowToBlock(row) : null;
  }

  /**
   * Which of the given roll numbers already have a credential at this
   * institution. A single batch query instead of one lookup per row.
   */
  async findExistingRollNos(institutionId: string, rollNos: string[], client: Db = this.prisma): Promise<Set<string>> {
    if (rollNos.length === 0) return new Set();
    const rows = await client.credential.findMany({
      where: { institutionId, studentRollNo: { in: rollNos } },
      select: { studentRollNo: true },
    });
    return new Set(rows.map((r) => r.studentRollNo));
  }

  /**
   * Appends a new block to the chain. Runs inside a transaction that locks
   * the credentials table so concurrent issuances can't both read the same
   * chain tip and produce two blocks claiming the same prevHash/index, and
   * so the roll-no-registration check can't race with a concurrent insert.
   */
  async issue(draft: CredentialDraft): Promise<CredentialBlock> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE credentials IN EXCLUSIVE MODE`;

      const existing = await this.findExistingRollNos(draft.institutionId, [draft.studentRollNo], tx);
      if (existing.has(draft.studentRollNo)) {
        throw new ConflictException(
          `A student with roll no "${draft.studentRollNo}" is already registered at your institution`,
        );
      }

      const chain = await this.getFullChain(tx);
      const block = createBlock(draft, chain);
      await this.insertBlock(tx, block);
      return block;
    });
  }

  /**
   * Appends many blocks in one go (bulk CSV issuance). Each row still forms
   * its own sequential block — index N's prevHash is index N-1's blockHash,
   * computed in-memory as we go — but the whole batch commits atomically
   * under a single table lock, so it's all-or-nothing.
   */
  async issueBulk(drafts: CredentialDraft[]): Promise<CredentialBlock[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE credentials IN EXCLUSIVE MODE`;

      if (drafts.length > 0) {
        const institutionId = drafts[0].institutionId;
        const seenInBatch = new Set<string>();
        const duplicateRollNos = new Set<string>();
        for (const draft of drafts) {
          if (seenInBatch.has(draft.studentRollNo)) {
            duplicateRollNos.add(draft.studentRollNo);
          } else {
            seenInBatch.add(draft.studentRollNo);
          }
        }

        const alreadyRegistered = await this.findExistingRollNos(institutionId, [...seenInBatch], tx);
        alreadyRegistered.forEach((rollNo) => duplicateRollNos.add(rollNo));

        if (duplicateRollNos.size > 0) {
          throw new ConflictException(
            `These roll numbers are duplicated in the file or already registered at your institution: ${[...duplicateRollNos].join(', ')}`,
          );
        }
      }

      let chain = await this.getFullChain(tx);
      const newBlocks: CredentialBlock[] = [];

      for (const draft of drafts) {
        const block = createBlock(draft, chain);
        chain = [...chain, block];
        newBlocks.push(block);
      }

      for (const block of newBlocks) {
        await this.insertBlock(tx, block);
      }

      return newBlocks;
    });
  }

  private async insertBlock(client: Db, block: CredentialBlock): Promise<void> {
    await client.credential.create({
      data: {
        credentialId: block.credentialId,
        chainIndex: block.index,
        studentName: block.studentName,
        studentRollNo: block.studentRollNo,
        courseName: block.courseName,
        cgpa: block.cgpa,
        issueDate: block.issueDate,
        institutionId: block.institutionId,
        institutionName: block.institutionName,
        status: block.status,
        revokedAt: block.revokedAt ? new Date(block.revokedAt) : null,
        revokedReason: block.revokedReason,
        prevHash: block.prevHash,
        dataHash: block.dataHash,
        blockHash: block.blockHash,
        blockTimestamp: new Date(block.timestamp),
      },
    });
  }

  async revoke(
    credentialId: string,
    institutionId: string,
    reason: string | undefined,
  ): Promise<CredentialBlock | null> {
    const { count } = await this.prisma.credential.updateMany({
      where: { credentialId, institutionId, status: { not: 'revoked' } },
      data: { status: 'revoked', revokedAt: new Date(), revokedReason: reason || 'Not specified' },
    });
    if (count === 0) return null;
    const row = await this.prisma.credential.findUnique({ where: { credentialId } });
    return row ? rowToBlock(row) : null;
  }
}
