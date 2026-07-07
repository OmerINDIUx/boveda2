import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

type AutoAssignRule = {
  type: 'project_role' | 'specific_user' | 'discipline_lead' | 'document_uploader';
  projectRole?: string;
  userId?: string;
  disciplineId?: string;
  fallbackUserId?: string;
};

@Entity('rfi_templates')
export class RfiTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'title_template', length: 180 })
  titleTemplate!: string;

  @Column({ name: 'description_template', type: 'text' })
  descriptionTemplate!: string;

  @Column({ name: 'default_priority', length: 30, default: 'normal' })
  defaultPriority!: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ name: 'default_due_days', nullable: true })
  defaultDueDays?: number;

  @Column({ name: 'auto_assign_rule', type: 'json', nullable: true })
  autoAssignRule?: AutoAssignRule;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
