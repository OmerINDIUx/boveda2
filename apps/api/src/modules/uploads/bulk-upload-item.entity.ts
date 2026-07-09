import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BulkUpload } from './bulk-upload.entity';

@Entity('bulk_upload_items')
export class BulkUploadItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bulk_upload_id' })
  bulkUploadId!: string;

  @ManyToOne(() => BulkUpload, (upload) => upload.items)
  @JoinColumn({ name: 'bulk_upload_id' })
  bulkUpload!: BulkUpload;

  @Column({ name: 'file_key', length: 500 })
  fileKey!: string;

  @Column({ name: 'original_name', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', length: 120, nullable: true })
  mimeType?: string;

  @Column({ name: 'size_bytes', default: 0 })
  sizeBytes!: number;

  @Column({ length: 30, default: 'pending' })
  status!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
