import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectMember } from '../projects/project-member.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { StorageModule } from '../../storage/storage.module';
import { Bitacora } from './bitacora.entity';
import { BitacoraEntry } from './bitacora-entry.entity';
import { BitacoraPhoto } from './bitacora-photo.entity';
import { BitacoraHistory } from './bitacora-history.entity';
import { BitacorasController } from './bitacoras.controller';
import { BitacorasService } from './bitacoras.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bitacora,
      BitacoraEntry,
      BitacoraPhoto,
      BitacoraHistory,
      Project,
      ProjectMember,
      User,
    ]),
    StorageModule,
    NotificationsModule,
  ],
  controllers: [BitacorasController],
  providers: [BitacorasService, AccessScopeService],
})
export class BitacorasModule {}
