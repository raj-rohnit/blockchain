import { Injectable, NotFoundException } from '@nestjs/common';
import { CredentialsRepository } from '../credentials/credentials.repository';
import { CredentialBlock, computeDataHash, verifyChainUpTo } from '../common/hash-chain/hash-chain';

@Injectable()
export class VerifyService {
  constructor(private readonly credentialsRepository: CredentialsRepository) {}

  async verifyById(credentialId: string) {
    const block = await this.credentialsRepository.getById(credentialId);
    if (!block) {
      throw new NotFoundException('No credential found with this ID');
    }
    return this.buildResult(block);
  }

  async verifyByHash(blockHash: string) {
    const block = await this.credentialsRepository.getByBlockHash(blockHash);
    if (!block) {
      throw new NotFoundException('No credential found with this hash');
    }
    return this.buildResult(block);
  }

  // Bulk lookup for institution staff (e.g. admissions checking a stack of
  // applicants at once): each query may be a credential ID or a student
  // roll number. The whole chain is fetched once and reused for every
  // query and every chain walk, instead of one round trip per row.
  async verifyBulk(queries: string[]) {
    const chain = await this.credentialsRepository.getFullChain();
    const byCredentialId = new Map(chain.map((block) => [block.credentialId, block]));

    const results = queries
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .map((query) => {
        const direct = byCredentialId.get(query);
        const matches = direct ? [direct] : chain.filter((block) => block.studentRollNo === query);

        if (matches.length === 0) {
          return { query, found: false as const };
        }

        return matches.map((block) => {
          const { chainIntact, brokenLinks } = verifyChainUpTo(chain, block.index);
          return {
            query,
            found: true as const,
            valid: chainIntact && block.status !== 'revoked',
            chainIntact,
            brokenLinks,
            status: block.status,
            revokedAt: block.revokedAt,
            revokedReason: block.revokedReason,
            credential: {
              credentialId: block.credentialId,
              studentName: block.studentName,
              studentRollNo: block.studentRollNo,
              courseName: block.courseName,
              cgpa: block.cgpa,
              issueDate: block.issueDate,
              institutionName: block.institutionName,
            },
            blockHash: block.blockHash,
            index: block.index,
          };
        });
      })
      .flat();

    return { results };
  }

  // Demo helper: recompute the data hash for an arbitrary set of fields so the
  // verification portal can show, live, how changing a single field (e.g. a
  // CGPA) immediately breaks the hash match against the stored record.
  async tamperCheck(credentialId: string, fields: Record<string, any>) {
    const block = await this.credentialsRepository.getById(credentialId);
    if (!block) {
      throw new NotFoundException('No credential found with this ID');
    }

    const submittedHash = computeDataHash({ ...block, ...fields, credentialId: block.credentialId });
    return { matches: submittedHash === block.dataHash, submittedHash, originalHash: block.dataHash };
  }

  private async buildResult(block: CredentialBlock) {
    const chain = await this.credentialsRepository.getFullChain();
    const { chainIntact, brokenLinks } = verifyChainUpTo(chain, block.index);

    return {
      found: true,
      valid: chainIntact && block.status !== 'revoked',
      chainIntact,
      brokenLinks,
      status: block.status,
      revokedAt: block.revokedAt,
      revokedReason: block.revokedReason,
      credential: {
        credentialId: block.credentialId,
        studentName: block.studentName,
        studentRollNo: block.studentRollNo,
        courseName: block.courseName,
        cgpa: block.cgpa,
        issueDate: block.issueDate,
        institutionName: block.institutionName,
      },
      blockHash: block.blockHash,
      dataHash: block.dataHash,
      prevHash: block.prevHash,
      index: block.index,
      timestamp: block.timestamp,
    };
  }
}
