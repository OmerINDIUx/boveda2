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
import { User } from '../users/user.entity';
import { BulkUploadItem } from './bulk-upload-item.entity';

@Entity('bulk_uploads')
export class BulkUpload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 30, default: 'pending' })
  status!: string;

  @Column({ name: 'total_files', default: 0 })
  totalFiles!: number;

  @Column({ name: 'processed_files', default: 0 })
  processedFiles!: number;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  @OneToMany(() => BulkUploadItem, (item) => item.bulkUpload)
  items!: BulkUploadItem[];
}
