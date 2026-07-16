import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const PROJECT_CATALOG_CATEGORIES = ['workType', 'currentStage', 'priority'] as const;
export type ProjectCatalogCategory = (typeof PROJECT_CATALOG_CATEGORIES)[number];

@Entity('project_catalog_options')
export class ProjectCatalogOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 40 })
  category!: ProjectCatalogCategory;

  @Column({ length: 80 })
  value!: string;

  @Column({ length: 120 })
  label!: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
