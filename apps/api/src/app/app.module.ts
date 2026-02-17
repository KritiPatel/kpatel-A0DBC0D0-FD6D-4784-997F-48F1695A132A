import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { OrganizationModule } from './organizations/organization.module';
import { AuditModule } from './audit/audit.module';
import { SeedModule } from './seed/seed.module';

import { User, Organization, Task, AuditLog } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'dp'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'taskmanager'),
        entities: [User, Organization, Task, AuditLog],
        synchronize: true, // Auto-create tables in dev
        logging: false,
      }),
    }),
    AuthModule,
    TasksModule,
    OrganizationModule,
    AuditModule,
    SeedModule,
  ],
})
export class AppModule {}
