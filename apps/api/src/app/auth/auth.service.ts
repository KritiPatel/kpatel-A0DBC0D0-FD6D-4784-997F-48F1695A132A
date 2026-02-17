import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Organization } from '../entities';
import { Role, IJwtPayload, ILoginResponse } from '@task-manager/data';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@task-manager/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    organizationId: string;
  }): Promise<ILoginResponse> {
    // console.log('register called for:', dto.email);
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const org = await this.orgRepo.findOne({ where: { id: dto.organizationId } });
    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role || Role.VIEWER,
      organizationId: dto.organizationId,
    });

    const saved = await this.userRepo.save(user);

    const payload: IJwtPayload = {
      sub: saved.id,
      email: saved.email,
      role: saved.role,
      organizationId: saved.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        role: saved.role,
        organizationId: saved.organizationId,
      },
    };
  }

  async login(email: string, password: string, ipAddress?: string): Promise<ILoginResponse> {
    // console.log('login attempt:', email);
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // log successful login
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: 'auth',
      details: 'User logged in',
      ipAddress,
    });

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  // get user profile with org info
  getProfile = async (userId: string) => {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user;
    return result;
  };
}
