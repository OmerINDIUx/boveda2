import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';

@Entity('approval_request_actions')
export class ApprovalRequestAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id' })
  requestId!: string;

  @ManyToOne(() => ApprovalRequest)
  @JoinColumn({ name: 'request_id' })
  request!: ApprovalRequest;

  @Column({ name: 'step_id', nullable: true })
  stepId?: string;

  @ManyToOne(() => ApprovalStep)
  @JoinColumn({ name: 'step_id' })
  step?: ApprovalStep;

  @Column({ name: 'actor_id' })
  actorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor!: User;

  @Column({ length: 60 })
  action!: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'comment' | 'stopped' | 'expired';

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ name: 'step_order', nullable: true })
  stepOrder?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
