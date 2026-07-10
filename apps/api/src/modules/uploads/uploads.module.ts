import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadCatalog } from './upload-catalog.entity';
import { BulkUpload } from './bulk-upload.entity';
import { BulkUploadItem } from './bulk-upload-item.entity';
import { UploadCatalogsService } from './upload-catalogs.service';
import { BulkUploadsService } from './bulk-uploads.service';
import { UploadsController } from './uploads.controller';
import { UploadSessionsService } from './upload-sessions.service';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([UploadCatalog, BulkUpload, BulkUploadItem]), StorageModule],
  controllers: [UploadsController],
  providers: [UploadCatalogsService, BulkUploadsService, UploadSessionsService],
  exports: [UploadCatalogsService, BulkUploadsService, UploadSessionsService],
})
export class UploadsModule {}
