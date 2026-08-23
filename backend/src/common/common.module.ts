import { Module } from '@nestjs/common';
import { QrService } from './qr/qr.service';

@Module({
  providers: [QrService],
  exports: [QrService],
})
export class CommonModule {}
