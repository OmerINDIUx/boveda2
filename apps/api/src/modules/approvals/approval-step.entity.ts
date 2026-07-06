import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalFlow } from './approval-flow.entity';

@Entity('approval_steps')
export class ApprovalStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workflow_id' })
  workflowId!: string;

  @ManyToOne(() => ApprovalFlow, (workflow) => workflow.steps)
  @JoinColumn({ name: 'workflow_id' })
  workflow!: ApprovalFlow;

  @Column({ name: 'step_order' })
  stepOrder!: number;

  @Column({ length: 140 })
  name!: string;

  @Column({ name: 'approver_role_id', nullable: true })
  approverRoleId?: string;

  @Column({ name: 'approver_user_id', nullable: true })
  approverUserId?: string;

  @Column({ default: true })
  required!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
