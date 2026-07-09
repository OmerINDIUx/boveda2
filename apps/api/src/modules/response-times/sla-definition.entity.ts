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
import { User } from '../users/user.entity';

@Entity('sla_definitions')
export class SlaDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ length: 160 })
  name!: string;

  @Column({ length: 40 })
  scope!: string;

  @Column({ name: 'target_hours', type: 'decimal', precision: 10, scale: 2 })
  targetHours!: number;

  @Column({ name: 'warning_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  warningHours?: number;

  @Column({ name: 'escalation_user_id', nullable: true })
  escalationUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'escalation_user_id' })
  escalationUser?: User;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
