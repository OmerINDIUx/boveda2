import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';

@Entity('document_versions')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @ManyToOne(() => DocumentRecord)
  @JoinColumn({ name: 'document_id' })
  document!: DocumentRecord;

  @Column({ length: 40 })
  revision!: string;

  @Column({ name: 'file_key' })
  fileKey!: string;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'file_extension', length: 30, nullable: true })
  fileExtension?: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'uploaded_by_id' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: User;

  @Column({ length: 128, nullable: true })
  checksum?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'content_hash', length: 128, nullable: true })
  contentHash?: string;

  @Column({ name: 'content_extraction_status', length: 40, default: 'pending' })
  contentExtractionStatus!: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'content_extraction_error', type: 'text', nullable: true })
  contentExtractionError?: string;

  @Column({ name: 'content_extracted_at', type: 'datetime', nullable: true })
  contentExtractedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
