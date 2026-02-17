import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization, User } from '../entities';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User])],
  providers: [SeedService],
})
export class SeedModule {}
