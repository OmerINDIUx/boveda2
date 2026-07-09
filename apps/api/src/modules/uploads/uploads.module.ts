import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadCatalog } from './upload-catalog.entity';
import { BulkUpload } from './bulk-upload.entity';
import { BulkUploadItem } from './bulk-upload-item.entity';
import { UploadCatalogsService } from './upload-catalogs.service';
import { BulkUploadsService } from './bulk-uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UploadCatalog, BulkUpload, BulkUploadItem])],
  controllers: [UploadsController],
  providers: [UploadCatalogsService, BulkUploadsService],
  exports: [UploadCatalogsService, BulkUploadsService],
})
export class UploadsModule {}
