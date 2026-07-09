import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectEmail } from './project-email.entity';

@Entity('project_email_attachments')
export class ProjectEmailAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'email_id' })
  emailId!: string;

  @ManyToOne(() => ProjectEmail, (email) => email.attachments)
  @JoinColumn({ name: 'email_id' })
  email!: ProjectEmail;

  @Column({ name: 'file_key', length: 500 })
  fileKey!: string;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ name: 'mime_type', length: 120, nullable: true })
  mimeType?: string;

  @Column({ name: 'size_bytes', default: 0 })
  sizeBytes!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
