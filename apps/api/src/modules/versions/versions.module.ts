import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

@Module({
  imports: [DocumentsModule],
  controllers: [VersionsController],
  providers: [VersionsService]
})
export class VersionsModule {}
