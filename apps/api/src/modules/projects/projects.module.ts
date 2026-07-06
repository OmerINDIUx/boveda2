import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditModule } from '../audit/audit.module';
import { DocumentRecord } from '../documents/document.entity';
import { Discipline } from '../folders/discipline.entity';
import { Folder } from '../folders/folder.entity';
import { User } from '../users/user.entity';
import { ProjectCatalogOption } from './project-catalog-option.entity';
import { ProjectMember } from './project-member.entity';
import { Project } from './project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuditModule, TypeOrmModule.forFeature([Project, ProjectMember, User, Discipline, Folder, DocumentRecord, ProjectCatalogOption])],
  controllers: [ProjectsController],
  providers: [ProjectsService, AccessScopeService],
  exports: [ProjectsService, AccessScopeService, TypeOrmModule]
})
export class ProjectsModule {}
