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

@Entity('upload_catalogs')
export class UploadCatalog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ length: 80 })
  category!: string;

  @Column({ name: 'catalog_key', length: 80 })
  catalogKey!: string;

  @Column({ length: 160 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
