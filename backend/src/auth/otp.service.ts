import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpEntry {
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private otpStore = new Map<string, OtpEntry>();
  private readonly OTP_TTL_MS: number;
  private readonly OTP_LENGTH: number;
  private readonly MAX_ATTEMPTS = 5;

  constructor(private configService: ConfigService) {
    this.OTP_TTL_MS =
      (this.configService.get<number>('OTP_TTL_SECONDS', 300)) * 1000;
    this.OTP_LENGTH = this.configService.get<number>('OTP_LENGTH', 6);
  }

  generateOtp(phone: string): string {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.OTP_TTL_MS);
    this.otpStore.set(phone, { code, expiresAt, attempts: 0 });
    this.logger.log(`OTP generated for ${phone}: ${code} (expires: ${expiresAt.toISOString()})`);
    return code;
  }

  verifyOtp(phone: string, code: string): boolean {
    const entry = this.otpStore.get(phone);

    if (!entry) {
      return false;
    }

    if (new Date() > entry.expiresAt) {
      this.otpStore.delete(phone);
      return false;
    }

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(phone);
      return false;
    }

    entry.attempts++;

    if (entry.code !== code) {
      return false;
    }

    this.otpStore.delete(phone);
    return true;
  }

  private generateCode(): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }
}
