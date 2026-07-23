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
import { ProjectEmailThread } from './project-email-thread.entity';
import { ProjectEmailAddress } from './project-email-address.entity';
import { ProjectEmailAttachment } from './project-email-attachment.entity';

@Entity('project_emails')
export class ProjectEmail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'thread_id', nullable: true })
  threadId?: string;

  @ManyToOne(() => ProjectEmailThread, (thread) => thread.emails)
  @JoinColumn({ name: 'thread_id' })
  thread?: ProjectEmailThread;

  @Column({ name: 'email_address_id', nullable: true })
  emailAddressId?: string;

  @ManyToOne(() => ProjectEmailAddress)
  @JoinColumn({ name: 'email_address_id' })
  emailAddress?: ProjectEmailAddress;

  @Column({ name: 'from_address', length: 255 })
  fromAddress!: string;

  @Column({ name: 'from_name', length: 255, nullable: true })
  fromName?: string;

  @Column({ name: 'to_address', type: 'text' })
  toAddress!: string;

  @Column({ type: 'text', nullable: true })
  cc?: string;

  @Column({ length: 500 })
  subject!: string;

  @Column({ name: 'body_text', type: 'longtext', nullable: true })
  bodyText?: string;

  @Column({ name: 'body_html', type: 'longtext', nullable: true })
  bodyHtml?: string;

  @Column({ name: 'message_id', length: 255, nullable: true, unique: true })
  messageId?: string;

  @Column({ name: 'in_reply_to', length: 255, nullable: true })
  inReplyTo?: string;

  @Column({ name: 'references_header', type: 'text', nullable: true })
  referencesHeader?: string;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ name: 'is_internal', default: true })
  isInternal!: boolean;

  @Column({ name: 'received_at', type: 'datetime' })
  receivedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ProjectEmailAttachment, (att) => att.email)
  attachments!: ProjectEmailAttachment[];
}
