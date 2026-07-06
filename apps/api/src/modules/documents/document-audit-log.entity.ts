import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentRecord } from './document.entity';

@Entity('document_audit_logs')
export class DocumentAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @ManyToOne(() => DocumentRecord, (document) => document.auditLogs)
  @JoinColumn({ name: 'document_id' })
  document!: DocumentRecord;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @Column({ length: 100 })
  action!: string;

  @Column({ name: 'before_state', type: 'json', nullable: true })
  beforeState?: Record<string, unknown>;

  @Column({ name: 'after_state', type: 'json', nullable: true })
  afterState?: Record<string, unknown>;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', length: 255, nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
