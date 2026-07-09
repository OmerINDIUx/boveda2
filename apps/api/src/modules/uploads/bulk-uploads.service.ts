import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulkUpload } from './bulk-upload.entity';
import { BulkUploadItem } from './bulk-upload-item.entity';
import { BulkUploadStartDto, BulkUploadFileDto } from './dto/upload-catalog.dto';

@Injectable()
export class BulkUploadsService {
  constructor(
    @InjectRepository(BulkUpload)
    private readonly uploads: Repository<BulkUpload>,
    @InjectRepository(BulkUploadItem)
    private readonly items: Repository<BulkUploadItem>
  ) {}

  async start(dto: BulkUploadStartDto, userId: string) {
    const upload = this.uploads.create({
      projectId: dto.projectId,
      userId,
      status: 'pending',
      totalFiles: 0,
      processedFiles: 0,
      metadata: dto.metadata,
    });
    return this.uploads.save(upload);
  }

  async addFiles(uploadId: string, files: BulkUploadFileDto[]) {
    const upload = await this.uploads.findOne({ where: { id: uploadId } });
    if (!upload) throw new NotFoundException('Carga masiva no encontrada');

    const items = files.map((f) =>
      this.items.create({
        bulkUploadId: uploadId,
        fileKey: f.fileKey,
        originalName: f.originalName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        status: 'pending',
        metadata: f.metadata,
      })
    );

    await this.items.save(items);
    upload.totalFiles += items.length;
    await this.uploads.save(upload);

    return { added: items.length, totalFiles: upload.totalFiles };
  }

  async processAll(uploadId: string) {
    const upload = await this.uploads.findOne({
      where: { id: uploadId },
      relations: ['items'],
    });
    if (!upload) throw new NotFoundException('Carga masiva no encontrada');

    upload.status = 'processing';
    await this.uploads.save(upload);

    for (const item of upload.items) {
      try {
        item.status = 'completed';
        upload.processedFiles += 1;
        await this.items.save(item);
      } catch (error) {
        item.status = 'failed';
        item.errorMessage = (error as Error).message;
        await this.items.save(item);
      }
    }

    upload.status = upload.processedFiles === upload.totalFiles ? 'completed' : 'failed';
    upload.completedAt = new Date();
    await this.uploads.save(upload);

    return { status: upload.status, processed: upload.processedFiles, total: upload.totalFiles };
  }

  async getProgress(uploadId: string) {
    const upload = await this.uploads.findOne({
      where: { id: uploadId },
      relations: ['items'],
    });
    if (!upload) throw new NotFoundException('Carga masiva no encontrada');
    return {
      status: upload.status,
      totalFiles: upload.totalFiles,
      processedFiles: upload.processedFiles,
      items: upload.items.map((item) => ({
        id: item.id,
        originalName: item.originalName,
        status: item.status,
        errorMessage: item.errorMessage,
      })),
    };
  }

  async markItemsWithMetadata(uploadId: string, metadata: Record<string, unknown>) {
    const items = await this.items.find({ where: { bulkUploadId: uploadId } });
    for (const item of items) {
      item.metadata = { ...item.metadata, ...metadata };
      await this.items.save(item);
    }
    return { updated: items.length };
  }
}
