import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DocumentRecord } from './document.entity';

@Entity('document_permissions')
export class DocumentPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @ManyToOne(() => DocumentRecord, (document) => document.permissions)
  @JoinColumn({ name: 'document_id' })
  document!: DocumentRecord;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'role_id', nullable: true })
  roleId?: string;

  @Column({ name: 'project_user_id', nullable: true })
  projectUserId?: string;

  @Column({ length: 40 })
  permission!: 'view' | 'download' | 'edit' | 'approve' | 'owner';

  @Column({ name: 'granted_by_id', nullable: true })
  grantedById?: string;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
