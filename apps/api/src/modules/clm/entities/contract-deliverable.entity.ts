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
import { User } from '../../users/user.entity';
import { Contract } from '../contract.entity';

@Entity('contract_deliverables')
export class ContractDeliverable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.deliverables)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'acceptance_criteria', type: 'text', nullable: true })
  acceptanceCriteria?: string;

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ length: 40, default: 'pending' })
  status!: 'pending' | 'in_progress' | 'delivered' | 'accepted' | 'rejected' | 'overdue';

  @Column({ name: 'delivered_at', type: 'datetime', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'accepted_at', type: 'datetime', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
