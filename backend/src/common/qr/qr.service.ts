import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateVerificationQr(credentialId: string) {
    const base = process.env.PUBLIC_VERIFY_BASE_URL || 'http://localhost:5173/verify';
    const verifyUrl = `${base}/${credentialId}`;
    const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 300 });
    return { verifyUrl, dataUrl };
  }
}
