import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { RfiAttachment } from './rfi-attachment.entity';
import { RfiComment } from './rfi-comment.entity';
import { RfiHistory } from './rfi-history.entity';
import { RfiTemplate } from './rfi-template.entity';

@Entity('rfis')
export class Rfi {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'document_id', nullable: true })
  documentId?: string;

  @ManyToOne(() => DocumentRecord)
  @JoinColumn({ name: 'document_id' })
  document?: DocumentRecord;

  @Column({ name: 'subject', length: 180 })
  title!: string;

  @Column({ name: 'question', type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  answer?: string;

  @Column({ default: 'open' })
  status!: 'open' | 'in_progress' | 'answered' | 'closed' | 'overdue';

  @Column({ default: 'normal' })
  priority!: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ name: 'template_id', nullable: true })
  templateId?: string;

  @ManyToOne(() => RfiTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: RfiTemplate;

  @Column({ name: 'reply_to_address', length: 255, nullable: true })
  replyToAddress?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  requester!: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt?: Date;

  @OneToMany(() => RfiComment, (comment) => comment.rfi)
  comments!: RfiComment[];

  @OneToMany(() => RfiAttachment, (attachment) => attachment.rfi)
  attachments!: RfiAttachment[];

  @OneToMany(() => RfiHistory, (history) => history.rfi)
  history!: RfiHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
