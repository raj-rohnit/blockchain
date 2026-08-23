import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentInstitution } from '../auth/decorators/current-institution.decorator';
import { InstitutionTokenPayload } from '../auth/interfaces/institution.interface';
import { CredentialsService } from './credentials.service';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';
import { BulkIssueDto } from './dto/bulk-issue.dto';

@Controller('credentials')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  issue(@Body() dto: IssueCredentialDto, @CurrentInstitution() institution: InstitutionTokenPayload) {
    return this.credentialsService.issue(dto, institution);
  }

  @Get()
  list(@CurrentInstitution() institution: InstitutionTokenPayload) {
    return this.credentialsService.listMine(institution.id);
  }

  // Step 1 of bulk issuance: parse + validate the CSV only. Nothing is
  // written to the database here.
  @Post('bulk/validate')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  validateBulk(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentInstitution() institution: InstitutionTokenPayload,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required (form field name "file")');
    }
    return this.credentialsService.validateBulkCsv(file.buffer, institution.id);
  }

  // Step 2 of bulk issuance: commit the rows the institution confirmed
  // from the validate step. Every row is re-validated server-side, so an
  // incomplete batch is rejected here too — not just at parse time.
  @Post('bulk/commit')
  commitBulk(@Body() dto: BulkIssueDto, @CurrentInstitution() institution: InstitutionTokenPayload) {
    return this.credentialsService.issueBulk(dto.rows, institution);
  }

  @Get(':credentialId/qr')
  getQr(@Param('credentialId') credentialId: string, @CurrentInstitution() institution: InstitutionTokenPayload) {
    return this.credentialsService.getQr(credentialId, institution.id);
  }

  @Post(':credentialId/revoke')
  revoke(
    @Param('credentialId') credentialId: string,
    @Body() dto: RevokeCredentialDto,
    @CurrentInstitution() institution: InstitutionTokenPayload,
  ) {
    return this.credentialsService.revoke(credentialId, institution.id, dto.reason);
  }
}
