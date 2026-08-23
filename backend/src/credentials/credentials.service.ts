import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CredentialsRepository } from './credentials.repository';
import { QrService } from '../common/qr/qr.service';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { InstitutionTokenPayload } from '../auth/interfaces/institution.interface';
import { CredentialDraft } from '../common/hash-chain/hash-chain';
import { parseCredentialsCsv } from './bulk/csv-parser';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly qrService: QrService,
  ) {}

  async issue(dto: IssueCredentialDto, institution: InstitutionTokenPayload) {
    const draft = this.buildDraft(dto, institution);
    const block = await this.credentialsRepository.issue(draft);
    const { verifyUrl, dataUrl } = await this.qrService.generateVerificationQr(block.credentialId);
    return { credential: block, verifyUrl, qrCodeDataUrl: dataUrl };
  }

  // Parses an uploaded CSV and reports, per row, whether every required
  // field is filled, whether the roll number repeats within the file, and
  // whether that roll number is already registered at this institution —
  // without writing anything to the database. The institution reviews this
  // report and only then calls issueBulk with the rows it confirms.
  async validateBulkCsv(buffer: Buffer, institutionId: string) {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const rows = parseCredentialsCsv(buffer);

    // Only check rows that are otherwise clean against the database — one
    // batch query for the whole file instead of one query per row.
    const candidateRollNos = [...new Set(rows.filter((r) => r.errors.length === 0).map((r) => r.studentRollNo))];
    const alreadyRegistered = await this.credentialsRepository.findExistingRollNos(institutionId, candidateRollNos);
    for (const row of rows) {
      if (row.errors.length === 0 && alreadyRegistered.has(row.studentRollNo)) {
        row.errors.push(`A student with roll no "${row.studentRollNo}" is already registered at your institution`);
      }
    }

    const validRows = rows.filter((r) => r.errors.length === 0);
    const invalidRows = rows.filter((r) => r.errors.length > 0);

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      allValid: rows.length > 0 && invalidRows.length === 0,
      validRows,
      invalidRows,
    };
  }

  // Commits a whole batch as sequential chain blocks. The DTO's per-row
  // validators already reject the request if any row is missing a
  // required field, so reaching here means the whole batch is complete —
  // it is issued all at once, or not at all.
  async issueBulk(rows: IssueCredentialDto[], institution: InstitutionTokenPayload) {
    const drafts = rows.map((dto) => this.buildDraft(dto, institution));
    const blocks = await this.credentialsRepository.issueBulk(drafts);
    return { issuedCount: blocks.length, credentials: blocks };
  }

  private buildDraft(dto: IssueCredentialDto, institution: InstitutionTokenPayload): CredentialDraft {
    return {
      credentialId: uuidv4(),
      studentName: dto.studentName,
      studentRollNo: dto.studentRollNo,
      courseName: dto.courseName,
      cgpa: dto.cgpa,
      issueDate: dto.issueDate,
      institutionId: institution.id,
      institutionName: institution.name,
      status: 'active',
      revokedAt: null,
      revokedReason: null,
    };
  }

  async listMine(institutionId: string) {
    const credentials = await this.credentialsRepository.getByInstitution(institutionId);
    return { credentials };
  }

  async getQr(credentialId: string, institutionId: string) {
    const block = await this.credentialsRepository.getById(credentialId);
    if (!block || block.institutionId !== institutionId) {
      throw new NotFoundException('Credential not found');
    }
    const { verifyUrl, dataUrl } = await this.qrService.generateVerificationQr(block.credentialId);
    return { verifyUrl, qrCodeDataUrl: dataUrl };
  }

  async revoke(credentialId: string, institutionId: string, reason: string | undefined) {
    const existing = await this.credentialsRepository.getById(credentialId);
    if (!existing || existing.institutionId !== institutionId) {
      throw new NotFoundException('Credential not found');
    }
    if (existing.status === 'revoked') {
      throw new ConflictException('Credential is already revoked');
    }
    const credential = await this.credentialsRepository.revoke(credentialId, institutionId, reason);
    return { credential };
  }
}
