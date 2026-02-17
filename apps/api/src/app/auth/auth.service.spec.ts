import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { User, Organization } from '../entities';
import { Role } from '@task-manager/data';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let orgRepo: any;
  let jwtService: any;
  let auditService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    password: '', // Will be set in beforeEach
    firstName: 'Test',
    lastName: 'User',
    role: Role.ADMIN,
    organizationId: 'org-1',
  };

  const mockOrg = {
    id: 'org-1',
    name: 'Test Org',
    parentId: null,
  };

  beforeEach(async () => {
    mockUser.password = await bcrypt.hash('password123', 12);

    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto: any) => ({ ...dto, id: 'new-user-id' })),
      save: jest.fn((user: any) => Promise.resolve({ ...user, id: user.id || 'new-user-id' })),
    };

    orgRepo = {
      findOne: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(() => 'mock-jwt-token'),
    };

    auditService = {
      log: jest.fn(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token and user on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login('test@test.com', 'password123');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@test.com');
      expect(result.user.role).toBe(Role.ADMIN);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', email: 'test@test.com' })
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login('nobody@test.com', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.login('test@test.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should log audit entry on successful login', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await service.login('test@test.com', 'password123', '127.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          action: 'LOGIN',
          resource: 'auth',
          ipAddress: '127.0.0.1',
        })
      );
    });
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      userRepo.findOne.mockResolvedValue(null);
      orgRepo.findOne.mockResolvedValue(mockOrg);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationId: 'org-1',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('new@test.com');
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          organizationId: 'org-1',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid organization', async () => {
      userRepo.findOne.mockResolvedValue(null);
      orgRepo.findOne.mockResolvedValue(null);

      await expect(
        service.register({
          email: 'new@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          organizationId: 'nonexistent',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash the password before saving', async () => {
      userRepo.findOne.mockResolvedValue(null);
      orgRepo.findOne.mockResolvedValue(mockOrg);

      await service.register({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationId: 'org-1',
      });

      const savedUser = userRepo.create.mock.calls[0][0];
      expect(savedUser.password).not.toBe('password123');
      expect(await bcrypt.compare('password123', savedUser.password)).toBe(true);
    });
  });
});
