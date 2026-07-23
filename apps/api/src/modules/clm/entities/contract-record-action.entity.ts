import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { ContractRecord } from './contract-record.entity';

@Entity('contract_record_actions')
export class ContractRecordAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'record_id' })
  recordId!: string;

  @ManyToOne(() => ContractRecord, (record) => record.actions)
  @JoinColumn({ name: 'record_id' })
  record!: ContractRecord;

  @Column({ length: 50 })
  action!: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ name: 'actor_id' })
  actorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
