import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentEmbedding } from './document-embedding.entity';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @Column({ name: 'version_id', nullable: true })
  versionId?: string;

  @Column({ name: 'chunk_index' })
  chunkIndex!: number;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ name: 'token_count', nullable: true })
  tokenCount?: number;

  @Column({ name: 'page_number', nullable: true })
  pageNumber?: number;

  @Column({ name: 'section_label', length: 255, nullable: true })
  sectionLabel?: string;

  @OneToMany(() => DocumentEmbedding, (embedding) => embedding.chunk)
  embeddings!: DocumentEmbedding[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
