import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('email_workflow_actions')
export class EmailWorkflowAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ length: 160 })
  name!: string;

  @Column({ name: 'trigger_event', length: 40 })
  triggerEvent!: string;

  @Column({ name: 'action_type', length: 40 })
  actionType!: string;

  @Column({ type: 'simple-json' })
  config!: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
