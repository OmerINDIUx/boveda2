import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../storage/storage.module';
import { Project } from '../projects/project.entity';
import { ProjectEmail } from './project-email.entity';
import { ProjectEmailAddress } from './project-email-address.entity';
import { ProjectEmailAttachment } from './project-email-attachment.entity';
import { ProjectEmailThread } from './project-email-thread.entity';
import { ProjectEmailsController } from './project-emails.controller';
import { ProjectEmailsService } from './project-emails.service';

@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([
      ProjectEmail,
      ProjectEmailAddress,
      ProjectEmailAttachment,
      ProjectEmailThread,
      Project,
    ]),
  ],
  controllers: [ProjectEmailsController],
  providers: [ProjectEmailsService],
  exports: [ProjectEmailsService],
})
export class ProjectEmailsModule {}
