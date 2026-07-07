import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

@Entity('document_query_history')
export class DocumentQueryHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'session_id', type: 'char', length: 36, nullable: true })
  sessionId?: string;

  @Column({ name: 'document_id', nullable: true })
  documentId?: string;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'longtext' })
  answer!: string;

  @Column({ length: 40 })
  status!: 'answered' | 'insufficient_information' | 'error';

  @Column({ name: 'citations_json', type: 'json', nullable: true })
  citationsJson?: Array<Record<string, unknown>>;

  @Column({ name: 'response_json', type: 'json', nullable: true })
  responseJson?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
