import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>
  ) {}

  async findAll(): Promise<Organization[]> {
    return this.orgRepo.find({ relations: ['children'] });
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(name: string, parentId?: string): Promise<Organization> {
    const org = this.orgRepo.create({ name, parentId: parentId || null });
    return this.orgRepo.save(org);
  }

  // get child org ids for rbac scoping
  async getChildOrgIds(organizationId: string): Promise<string[]> {
    const children = await this.orgRepo.find({
      where: { parentId: organizationId },
    });
    return children.map((c) => c.id);
  }

  // check if orgA is parent of orgB
  isParentOrSame = async (orgA: string, orgB: string): Promise<boolean> => {
    if (orgA === orgB) return true;
    const childOrg = await this.orgRepo.findOne({ where: { id: orgB } });
    return childOrg?.parentId === orgA;
  };
}
