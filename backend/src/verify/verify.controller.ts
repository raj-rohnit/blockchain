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
import { VerifyService } from './verify.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BulkVerifyDto } from './dto/bulk-verify.dto';
import { parseBulkVerifyFile } from './bulk-verify-file-parser';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  // Declared before ':credentialId' so lookups like /verify/hash/<hash> and
  // /verify/bulk don't get swallowed as a credentialId route param.
  @Get('hash/:blockHash')
  verifyByHash(@Param('blockHash') blockHash: string) {
    return this.verifyService.verifyByHash(blockHash);
  }

  // Bulk lookup for logged-in institution staff (e.g. an admissions office
  // checking many applicants' credential IDs or roll numbers at once).
  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  verifyBulk(@Body() dto: BulkVerifyDto) {
    return this.verifyService.verifyBulk(dto.queries);
  }

  // Same as above, but the queries come from an uploaded spreadsheet
  // (.xlsx/.xls/.csv) instead of a pasted list.
  @Post('bulk/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  verifyBulkFromFile(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Spreadsheet file is required (form field name "file")');
    }
    const queries = parseBulkVerifyFile(file.buffer);
    if (queries.length === 0) {
      throw new BadRequestException('No roll numbers or credential IDs found in that file');
    }
    return this.verifyService.verifyBulk(queries);
  }

  @Get(':credentialId')
  verifyById(@Param('credentialId') credentialId: string) {
    return this.verifyService.verifyById(credentialId);
  }

  @Post(':credentialId/tamper-check')
  tamperCheck(@Param('credentialId') credentialId: string, @Body() fields: Record<string, any>) {
    return this.verifyService.tamperCheck(credentialId, fields);
  }
}
