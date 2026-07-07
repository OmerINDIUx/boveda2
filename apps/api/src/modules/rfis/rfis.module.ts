import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { User } from '../users/user.entity';
import { StorageModule } from '../../storage/storage.module';
import { RfiAttachment } from './rfi-attachment.entity';
import { RfiComment } from './rfi-comment.entity';
import { RfiHistory } from './rfi-history.entity';
import { RfiTemplate } from './rfi-template.entity';
import { Rfi } from './rfi.entity';
import { RfisController } from './rfis.controller';
import { RfisService } from './rfis.service';

@Module({
  imports: [
    ProjectsModule,
    NotificationsModule,
    StorageModule,
    TypeOrmModule.forFeature([Rfi, RfiComment, RfiAttachment, RfiHistory, RfiTemplate, User]),
  ],
  controllers: [RfisController],
  providers: [RfisService],
})
export class RfisModule {}
