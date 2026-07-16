import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { BitacoraEntry } from './bitacora-entry.entity';

@Entity('bitacora_history')
export class BitacoraHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entry_id' })
  entryId!: string;

  @ManyToOne(() => BitacoraEntry)
  @JoinColumn({ name: 'entry_id' })
  entry!: BitacoraEntry;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  @Column({ length: 80 })
  accion!: string;

  @Column({ name: 'before_state', type: 'json', nullable: true })
  beforeState?: Record<string, unknown>;

  @Column({ name: 'after_state', type: 'json', nullable: true })
  afterState?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
