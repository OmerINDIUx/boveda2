import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 180 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'contract_type', length: 100, nullable: true })
  contractType?: string;

  @Column({ type: 'longtext', nullable: true })
  content?: string;

  @Column({ length: 20, default: '1.0' })
  version!: string;

  @Column({ default: 0 })
  versionNumber!: number;

  @Column({ name: 'parent_template_id', nullable: true })
  parentTemplateId?: string;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

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
}
