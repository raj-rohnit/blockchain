import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { CredentialsRepository } from './credentials.repository';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [CredentialsController],
  providers: [CredentialsService, CredentialsRepository],
  exports: [CredentialsRepository],
})
export class CredentialsModule {}
