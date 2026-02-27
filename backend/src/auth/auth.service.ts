import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const phone = this.normalizePhone(dto.phone);
    const code = this.otpService.generateOtp(phone);

    // In production: send via SMS provider
    this.logger.log(`[SMS] Sending OTP ${code} to ${phone}`);
    // TODO: integrate SMS provider (Twilio, etc.)

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ token: string; user: any }> {
    const phone = this.normalizePhone(dto.phone);
    const isValid = this.otpService.verifyOtp(phone, dto.code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // First-time login: create a minimal user record
      user = await this.prisma.user.create({
        data: {
          phone,
          fullName: '',
          email: `${phone}@temp.speeddating.app`,
          birthDate: new Date('2000-01-01'),
          gender: 'other',
          relationshipStatus: 'single',
          facebookUrl: '',
          aboutText: '',
          lookingForText: '',
          consentFlags: {},
        },
      });
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      isAdmin: user.isAdmin,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
      },
    };
  }

  private normalizePhone(phone: string): string {
    // Basic normalization: remove spaces, dashes, etc.
    return phone.replace(/[\s\-\(\)]/g, '');
  }
}
