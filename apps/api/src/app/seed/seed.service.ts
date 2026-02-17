import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization, User } from '../entities';
import { Role } from '@task-manager/data';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>
  ) {}

  async onModuleInit() {
    const orgCount = await this.orgRepo.count();
    if (orgCount > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding database...');

    // Create parent organization
    const parentOrg = await this.orgRepo.save(
      this.orgRepo.create({ name: 'Acme Corporation', parentId: null })
    );

    // Create child organization (2-level hierarchy)
    const childOrg = await this.orgRepo.save(
      this.orgRepo.create({ name: 'Acme Engineering', parentId: parentOrg.id })
    );

    // Create users with different roles
    const hashedPassword = await bcrypt.hash('password123', 12);

    await this.userRepo.save([
      this.userRepo.create({
        email: 'owner@acme.com',
        password: hashedPassword,
        firstName: 'Kriti',
        lastName: 'Owner',
        role: Role.OWNER,
        organizationId: parentOrg.id,
      }),
      this.userRepo.create({
        email: 'admin@acme.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Admin',
        role: Role.ADMIN,
        organizationId: parentOrg.id,
      }),
      this.userRepo.create({
        email: 'viewer@acme.com',
        password: hashedPassword,
        firstName: 'Charlie',
        lastName: 'Viewer',
        role: Role.VIEWER,
        organizationId: parentOrg.id,
      }),
      this.userRepo.create({
        email: 'admin@engineering.acme.com',
        password: hashedPassword,
        firstName: 'Diana',
        lastName: 'Engineer',
        role: Role.ADMIN,
        organizationId: childOrg.id,
      }),
    ]);

    this.logger.log('Seeding complete!');
    this.logger.log(`Parent Org ID: ${parentOrg.id}`);
    this.logger.log(`Child Org ID: ${childOrg.id}`);
    this.logger.log('Users: owner@acme.com / admin@acme.com / viewer@acme.com / admin@engineering.acme.com');
    this.logger.log('Password for all: password123');
  }
}
