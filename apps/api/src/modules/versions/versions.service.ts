import { Injectable } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class VersionsService {
  constructor(private readonly documents: DocumentsService) {}

  async listByDocument(userId: string, documentId: string) {
    const detail = await this.documents.getDetail(userId, documentId, false);
    return detail.versions;
  }

  async create(dto: CreateVersionDto, uploadedById: string) {
    return this.documents.createVersion(uploadedById, dto.documentId, {
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      base64Content: dto.base64Content,
      revision: dto.revision,
      notes: dto.notes,
      sizeBytes: dto.sizeBytes
    });
  }
}
