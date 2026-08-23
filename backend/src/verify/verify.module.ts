import { Module } from '@nestjs/common';
import { CredentialsModule } from '../credentials/credentials.module';
import { AuthModule } from '../auth/auth.module';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';

@Module({
  imports: [CredentialsModule, AuthModule],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
