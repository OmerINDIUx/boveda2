import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentRecord } from './document.entity';

@Entity('document_metadata')
export class DocumentMetadata {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @ManyToOne(() => DocumentRecord, (document) => document.metadata)
  @JoinColumn({ name: 'document_id' })
  document!: DocumentRecord;

  @Column({ name: 'meta_key', length: 120 })
  metaKey!: string;

  @Column({ name: 'meta_value', type: 'text', nullable: true })
  metaValue?: string;

  @Column({ name: 'value_type', default: 'string' })
  valueType!: 'string' | 'number' | 'date' | 'boolean' | 'json';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
