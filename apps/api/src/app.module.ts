import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { FoldersModule } from './modules/folders/folders.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { VersionsModule } from './modules/versions/versions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RfisModule } from './modules/rfis/rfis.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiQueryModule } from './modules/ai-query/ai-query.module';
import { ClmModule } from './modules/clm/clm.module';
import { StorageModule } from './storage/storage.module';
import { NomenclaturesModule } from './modules/nomenclatures/nomenclatures.module';
import { ProjectEmailsModule } from './modules/project-emails/project-emails.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ResponseTimesModule } from './modules/response-times/response-times.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST ?? '127.0.0.1',
      port: Number(process.env.MYSQL_PORT ?? 3306),
      database: process.env.MYSQL_DATABASE ?? 'holocron',
      username: process.env.MYSQL_USER ?? 'root',
      password: process.env.MYSQL_PASSWORD ?? '',
      autoLoadEntities: true,
      synchronize: false,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: Number(process.env.THROTTLE_TTL ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 60),
      },
    ]),
    AuthModule,
    UsersModule,
    RolesModule,
    ProjectsModule,
    FoldersModule,
    DocumentsModule,
    VersionsModule,
    AuditModule,
    DashboardModule,
    RfisModule,
    ApprovalsModule,
    NotificationsModule,
    AiQueryModule,
    ClmModule,
    StorageModule,
    NomenclaturesModule,
    ProjectEmailsModule,
    UploadsModule,
    ResponseTimesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
