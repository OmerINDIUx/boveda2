import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { ProjectEmail } from './project-email.entity';

@Entity('project_email_threads')
export class ProjectEmailThread {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'subject_clean', length: 500 })
  subjectClean!: string;

  @Column({ name: 'last_email_at', type: 'datetime' })
  lastEmailAt!: Date;

  @Column({ name: 'email_count', default: 0 })
  emailCount!: number;

  @Column({ name: 'is_archived', default: false })
  isArchived!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ProjectEmail, (email) => email.thread)
  emails!: ProjectEmail[];
}
