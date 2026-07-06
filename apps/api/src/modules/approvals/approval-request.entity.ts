import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workflow_id' })
  workflowId!: string;

  @Column({ name: 'current_step_id', nullable: true })
  currentStepId?: string;

  @Column({ name: 'requester_id' })
  requesterId!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'entity_type', length: 80 })
  entityType!: 'document' | 'contract' | 'rfi';

  @Column({ name: 'entity_id' })
  entityId!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'in_process' | 'approved' | 'rejected' | 'stopped' | 'expired';

  @Column({ name: 'requested_at', type: 'datetime' })
  requestedAt!: Date;

  @Column({ name: 'last_action_at', type: 'datetime', nullable: true })
  lastActionAt?: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
