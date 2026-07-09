import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '../../storage/storage.service';
import { DocumentVersion } from '../versions/document-version.entity';
import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CollaboraService {
  private readonly logger = new Logger(CollaboraService.name);

  constructor(
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(DocumentVersion) private readonly versions: Repository<DocumentVersion>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly storage: StorageService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  private get collaboraHost() {
    return this.config.get<string>('COLLABORA_HOST') ?? 'http://localhost:9980';
  }

  private get apiHost() {
    return this.config.get<string>('API_HOST') ?? 'http://localhost:3001';
  }

  generateToken(userId: string, documentId: string) {
    return this.jwt.sign({ sub: userId, doc: documentId, purpose: 'wopi' }, { expiresIn: '1h' });
  }

  private verifyToken(token: string): { userId: string; documentId: string } {
    try {
      const payload = this.jwt.verify(token);
      if (payload.purpose !== 'wopi') {
        throw new ForbiddenException('Token inválido para WOPI');
      }
      return { userId: payload.sub, documentId: payload.doc };
    } catch {
      throw new ForbiddenException('Token de acceso inválido o expirado');
    }
  }

  async openUrl(userId: string, documentId: string) {
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (!this.isOfficeMime(document.fileExtension ?? '')) {
      throw new NotFoundException('Este formato no es compatible con Collabora');
    }

    const token = this.generateToken(userId, documentId);
    const wopiSrc = `${this.apiHost}/api/wopi/files/${documentId}`;
    const encoded = encodeURIComponent(wopiSrc);
    const url = `${this.collaboraHost}/cool/wopi/files/${documentId}?access_token=${token}&WOPISrc=${encoded}`;

    return { url, token };
  }

  async checkFileInfo(token: string, documentId: string) {
    const { userId } = this.verifyToken(token);
    const [document, user] = await Promise.all([
      this.documents.findOne({ where: { id: documentId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);
    if (!document || !user) {
      throw new NotFoundException('Documento o usuario no encontrado');
    }

    const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
    const ext = document.fileExtension ?? '';

    return {
      BaseFileName: `${document.name}.${ext}`,
      OwnerId: document.uploadedById,
      Size: document.sizeBytes ?? 0,
      UserId: user.id,
      UserFriendlyName: user.name ?? user.email,
      UserCanWrite: true,
      UserCanNotWriteRelative: true,
      LastModifiedTime:
        version?.createdAt?.toISOString() ??
        document.updatedAt?.toISOString() ??
        new Date().toISOString(),
      PostMessageOrigin: this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000',
    };
  }

  async getFile(token: string, documentId: string) {
    this.verifyToken(token);
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
    if (!version) {
      throw new NotFoundException('No hay versión actual para este documento');
    }
    return this.storage.read(version.fileKey);
  }

  async putFile(token: string, documentId: string, buffer: Buffer) {
    const { userId } = this.verifyToken(token);
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    const currentVersion = await this.versions.findOne({
      where: { id: document.currentVersionId ?? '' },
    });
    if (!currentVersion) {
      throw new NotFoundException('No hay versión actual para este documento');
    }

    const stored = await this.storage.putLocal(
      buffer,
      currentVersion.fileName,
      currentVersion.mimeType
    );

    const newVersion = await this.versions.save(
      this.versions.create({
        documentId,
        revision: this.nextRevision(currentVersion.revision),
        fileKey: stored.fileKey,
        fileName: currentVersion.fileName,
        fileExtension: currentVersion.fileExtension,
        mimeType: currentVersion.mimeType,
        sizeBytes: stored.sizeBytes,
        uploadedById: userId,
        notes: 'Guardado desde Collabora Online',
      })
    );

    document.currentVersionId = newVersion.id;
    document.originalFileKey = stored.fileKey;
    document.sizeBytes = stored.sizeBytes;
    await this.documents.save(document);

    return { size: stored.sizeBytes };
  }

  private nextRevision(current: string) {
    const code = current.charCodeAt(0);
    return String.fromCharCode(code + 1);
  }

  private isOfficeMime(extension: string) {
    return ['docx', 'xlsx', 'pptx'].includes(extension.toLowerCase());
  }
}
