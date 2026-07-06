import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { Discipline } from './discipline.entity';
import { Folder } from './folder.entity';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
  imports: [AuditModule, ProjectsModule, TypeOrmModule.forFeature([Folder, Discipline])],
  controllers: [FoldersController],
  providers: [FoldersService]
})
export class FoldersModule {}
