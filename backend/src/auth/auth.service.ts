import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /** Admin login: username + password */
  async adminLogin(dto: AdminLoginDto): Promise<{ token: string; user: any }> {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, isAdmin: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('שם משתמש או סיסמא שגויים');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('שם משתמש או סיסמא שגויים');
    }

    this.logger.log(`Admin login: ${user.username}`);
    return this.buildTokenResponse(user);
  }

  /** Participant login: email + password */
  async userLogin(dto: UserLoginDto): Promise<{ token: string; user: any }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('אימייל או סיסמא שגויים');
    }

    if (user.isAdmin) {
      throw new UnauthorizedException('מנהלים נכנסים דרך כניסת מנהלת');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('אימייל או סיסמא שגויים');
    }

    this.logger.log(`User login: ${user.email}`);
    return this.buildTokenResponse(user);
  }

  /** Participant registration: email + password (no email verification) */
  async userRegister(dto: UserRegisterDto): Promise<{ token: string; user: any }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('כתובת האימייל כבר רשומה במערכת');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        consentFlags: {},
      },
    });

    this.logger.log(`New user registered: ${user.email}`);
    return this.buildTokenResponse(user);
  }

  private buildTokenResponse(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        username: user.username ?? undefined,
      },
    };
  }
}
