import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Rfi } from './rfi.entity';

@Entity('rfi_history')
export class RfiHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rfi_id' })
  rfiId!: string;

  @ManyToOne(() => Rfi, (rfi) => rfi.history)
  @JoinColumn({ name: 'rfi_id' })
  rfi!: Rfi;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  @Column({ length: 80 })
  action!: string;

  @Column({ name: 'before_state', type: 'json', nullable: true })
  beforeState?: Record<string, unknown>;

  @Column({ name: 'after_state', type: 'json', nullable: true })
  afterState?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
