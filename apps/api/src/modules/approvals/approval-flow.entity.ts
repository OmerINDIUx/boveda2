import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalStep } from './approval-step.entity';

@Entity('approval_workflows')
export class ApprovalFlow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ name: 'entity_type', length: 80 })
  entityType!: 'document' | 'contract' | 'rfi';

  @Column({ name: 'scope_type', length: 40, default: 'global' })
  scopeType!: 'global' | 'document_specific';

  @Column({ name: 'target_document_id', nullable: true })
  targetDocumentId?: string;

  @Column({ name: 'require_for_publication', default: true })
  requireForPublication!: boolean;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'created_by_id', nullable: true })
  createdById?: string;

  @OneToMany(() => ApprovalStep, (step) => step.workflow)
  steps!: ApprovalStep[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
