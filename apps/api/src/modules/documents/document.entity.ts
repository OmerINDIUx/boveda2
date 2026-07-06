import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Discipline } from '../folders/discipline.entity';
import { Folder } from '../folders/folder.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { DocumentAuditLog } from './document-audit-log.entity';
import { DocumentComment } from './document-comment.entity';
import { DocumentMetadata } from './document-metadata.entity';
import { DocumentPermission } from './document-permission.entity';

@Entity('documents')
export class DocumentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'folder_id', nullable: true })
  folderId?: string;

  @ManyToOne(() => Folder)
  @JoinColumn({ name: 'folder_id' })
  folder?: Folder;

  @Column({ name: 'discipline_id', nullable: true })
  disciplineId?: string;

  @ManyToOne(() => Discipline)
  @JoinColumn({ name: 'discipline_id' })
  discipline?: Discipline;

  @Column({ length: 220 })
  name!: string;

  @Column({ name: 'document_number', length: 80 })
  documentNumber!: string;

  @Column({ default: 'draft' })
  status!: 'draft' | 'pending_approval' | 'in_review' | 'approved' | 'published' | 'expired' | 'superseded' | 'archived';

  @Column({ name: 'confidentiality_level', default: 'internal' })
  confidentialityLevel!: 'public' | 'internal' | 'confidential' | 'restricted';

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ name: 'current_version_id', nullable: true })
  currentVersionId?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ default: false })
  renewable!: boolean;

  @Column({ name: 'renewal_frequency', type: 'varchar', length: 20, nullable: true })
  renewalFrequency?: 'day' | 'week' | 'month' | 'year' | null;

  @Column({ name: 'original_file_key', nullable: true })
  originalFileKey?: string;

  @Column({ name: 'file_extension', length: 30, nullable: true })
  fileExtension?: string;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes?: number;

  @Column({ name: 'uploaded_by_id' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: User;

  @OneToMany(() => DocumentMetadata, (metadata) => metadata.document)
  metadata!: DocumentMetadata[];

  @OneToMany(() => DocumentPermission, (permission) => permission.document)
  permissions!: DocumentPermission[];

  @OneToMany(() => DocumentAuditLog, (log) => log.document)
  auditLogs!: DocumentAuditLog[];

  @OneToMany(() => DocumentComment, (comment) => comment.document)
  comments!: DocumentComment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
