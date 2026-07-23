import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';
import { StorageService, StoredFile } from '../../storage/storage.service';

interface UploadSession {
  id: string;
  fileName: string;
  mimeType: string;
  totalSize: number;
  totalChunks: number;
  dir: string;
}

@Injectable()
export class UploadSessionsService {
  private readonly sessions = new Map<string, UploadSession>();
  private readonly tempRoot = resolve(process.cwd(), '.tmp', 'uploads');

  constructor(private readonly storage: StorageService) {}

  async init(fileName: string, mimeType: string, totalSize: number, totalChunks: number) {
    const safeFileName = basename(fileName || 'upload.bin');
    const uploadId = randomUUID();
    const dir = join(this.tempRoot, uploadId);
    await mkdir(dir, { recursive: true });
    this.sessions.set(uploadId, {
      id: uploadId,
      fileName: safeFileName,
      mimeType: mimeType || 'application/octet-stream',
      totalSize,
      totalChunks,
      dir,
    });
    return { uploadId };
  }

  async appendChunk(uploadId: string, chunkIndex: number, buffer: Buffer) {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new NotFoundException(`Upload session not found: ${uploadId}`);
    }
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new NotFoundException(`Chunk out of range: ${chunkIndex}`);
    }
    await writeFile(join(session.dir, `${chunkIndex}.part`), buffer);
    return { ok: true };
  }

  async complete(uploadId: string): Promise<StoredFile> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new NotFoundException(`Upload session not found: ${uploadId}`);
    }

    const parts: Buffer[] = [];
    let size = 0;
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = join(session.dir, `${i}.part`);
      const info = await stat(chunkPath).catch(() => null);
      if (!info) {
        throw new NotFoundException(`Missing chunk: ${i}`);
      }
      size += info.size;
      parts.push(await readFile(chunkPath));
    }

    const buffer = Buffer.concat(parts);
    if (
      size !== buffer.byteLength ||
      (session.totalSize > 0 && buffer.byteLength !== session.totalSize)
    ) {
      throw new BadRequestException(
        `El archivo recibido tiene ${buffer.byteLength} bytes, pero se esperaban ${session.totalSize}.`
      );
    }

    let stored: StoredFile;
    try {
      stored = await this.storage.put(buffer, session.fileName, session.mimeType);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error de almacenamiento desconocido';
      throw new InternalServerErrorException(`No fue posible guardar el archivo. ${detail}`);
    }
    await rm(session.dir, { recursive: true, force: true });
    this.sessions.delete(uploadId);
    return stored;
  }
}
