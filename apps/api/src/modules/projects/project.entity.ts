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
import { User } from '../users/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 140 })
  name!: string;

  @Column({ unique: true, length: 40 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'work_type', length: 120, nullable: true })
  workType?: string;

  @Column({ name: 'current_stage', length: 120, nullable: true })
  currentStage?: string;

  @Column({ length: 30, default: 'media' })
  priority!: 'baja' | 'media' | 'alta' | 'critica';

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: string;

  @Column({ default: 'planificacion', length: 40 })
  status!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'discipline_ids', type: 'simple-json', nullable: true })
  disciplineIds?: string[];

  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
