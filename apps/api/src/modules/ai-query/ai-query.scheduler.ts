import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DocumentChunk } from '../documents/document-chunk.entity';
import { DocumentRecord } from '../documents/document.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { DocumentIndexingService } from './document-indexing.service';

const FIVE_MINUTES = 5 * 60 * 1000;

@Injectable()
export class AiQueryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiQueryScheduler.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(DocumentVersion) private readonly versions: Repository<DocumentVersion>,
    @InjectRepository(DocumentChunk) private readonly chunks: Repository<DocumentChunk>,
    private readonly indexing: DocumentIndexingService
  ) {}

  onModuleInit() {
    this.indexPendingDocuments().catch((error) =>
      this.logger.error(error instanceof Error ? error.message : String(error))
    );
    this.timer = setInterval(() => {
      this.indexPendingDocuments().catch((error) =>
        this.logger.error(error instanceof Error ? error.message : String(error))
      );
    }, FIVE_MINUTES);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async indexPendingDocuments(limit = 10) {
    if (this.running) {
      return { ok: true, skipped: true, reason: 'already running' };
    }

    this.running = true;
    try {
      const documents = await this.findDocumentsNeedingIndexing(limit);
      if (!documents.length) {
        return { ok: true, indexed: 0 };
      }

      let indexed = 0;
      for (const document of documents) {
        try {
          const version = document.currentVersionId
            ? await this.versions.findOne({ where: { id: document.currentVersionId } })
            : null;
          if (!version) {
            continue;
          }
          await this.indexing.ensureVersionIndexed(document, version);
          indexed++;
        } catch (error) {
          this.logger.warn(
            `Error indexando ${document.name}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return { ok: true, indexed };
    } finally {
      this.running = false;
    }
  }

  private async findDocumentsNeedingIndexing(limit: number) {
    const docsWithVersions = await this.documents.find({
      where: { currentVersionId: In([...new Set((await this.getVersionIds()).map((v) => v))]) },
      take: 200,
    });

    const pending: DocumentRecord[] = [];

    for (const document of docsWithVersions) {
      if (!document.currentVersionId) continue;

      if (pending.length >= limit) break;

      const version = await this.versions.findOne({
        where: { id: document.currentVersionId },
      });
      if (!version) continue;

      if (version.contentExtractionStatus === 'completed') {
        const chunkCount = await this.chunks.count({
          where: { documentId: document.id, versionId: version.id },
        });
        if (chunkCount > 0) continue;
      }

      pending.push(document);
    }

    return pending.slice(0, limit);
  }

  private async getVersionIds() {
    const docs = await this.documents.find({ select: { currentVersionId: true } });
    return docs.map((d) => d.currentVersionId).filter((id): id is string => Boolean(id));
  }
}
