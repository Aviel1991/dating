import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── adminLogin ──────────────────────────────────────────────────────────

  describe('adminLogin', () => {
    it('מחזיר token כשהפרטים נכונים', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        username: 'Sarah',
        email: 'sarah@test.com',
        fullName: 'שרה',
        isAdmin: true,
        passwordHash: hash,
      });

      const result = await service.adminLogin({ username: 'Sarah', password: '123456' });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.isAdmin).toBe(true);
    });

    it('זורק 401 כשהמשתמש לא קיים', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.adminLogin({ username: 'NoSuchUser', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('זורק 401 כשהסיסמא שגויה', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        username: 'Sarah',
        email: 'sarah@test.com',
        fullName: 'שרה',
        isAdmin: true,
        passwordHash: hash,
      });

      await expect(
        service.adminLogin({ username: 'Sarah', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('זורק 401 כשאין passwordHash (משתמש ללא סיסמא)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        username: 'Sarah',
        email: 'sarah@test.com',
        fullName: 'שרה',
        isAdmin: true,
        passwordHash: null,
      });

      await expect(
        service.adminLogin({ username: 'Sarah', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── userLogin ───────────────────────────────────────────────────────────

  describe('userLogin', () => {
    it('מחזיר token כשהפרטים נכונים', async () => {
      const hash = await bcrypt.hash('mypassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-2',
        email: 'user@test.com',
        fullName: 'ישראל ישראלי',
        isAdmin: false,
        passwordHash: hash,
      });

      const result = await service.userLogin({ email: 'user@test.com', password: 'mypassword' });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.isAdmin).toBe(false);
    });

    it('זורק 401 כשהאימייל לא קיים', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.userLogin({ email: 'nobody@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('זורק 401 כשמנהל מנסה להיכנס דרך userLogin', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'sarah@test.com',
        fullName: 'שרה',
        isAdmin: true,
        passwordHash: hash,
      });

      await expect(
        service.userLogin({ email: 'sarah@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('זורק 401 כשהסיסמא שגויה', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-2',
        email: 'user@test.com',
        fullName: 'ישראל',
        isAdmin: false,
        passwordHash: hash,
      });

      await expect(
        service.userLogin({ email: 'user@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── userRegister ─────────────────────────────────────────────────────────

  describe('userRegister', () => {
    it('יוצר משתמש חדש ומחזיר token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-3',
        email: 'new@test.com',
        fullName: 'משתמש חדש',
        isAdmin: false,
        passwordHash: 'hashed',
      });

      const result = await service.userRegister({
        fullName: 'משתמש חדש',
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('זורק 409 כשהאימייל כבר קיים', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-2',
        email: 'existing@test.com',
      });

      await expect(
        service.userRegister({
          fullName: 'כפול',
          email: 'existing@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('שומר סיסמא כ-hash ולא בטקסט גלוי', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }) => ({
        id: 'uuid-3',
        ...data,
        isAdmin: false,
      }));

      await service.userRegister({
        fullName: 'בדיקה',
        email: 'hash@test.com',
        password: 'plaintext',
      });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('plaintext');
      const isHashed = await bcrypt.compare('plaintext', createCall.data.passwordHash);
      expect(isHashed).toBe(true);
    });
  });
});
