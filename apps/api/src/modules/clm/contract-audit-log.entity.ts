import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Contract } from './contract.entity';

@Entity('contract_audit_logs')
export class ContractAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.auditLogs)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User | null;

  @Column({ length: 100 })
  action!: string;

  @Column({ name: 'before_state', type: 'json', nullable: true })
  beforeState?: Record<string, unknown>;

  @Column({ name: 'after_state', type: 'json', nullable: true })
  afterState?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
