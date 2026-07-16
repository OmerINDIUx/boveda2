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
import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';
import { Contract } from './contract.entity';

@Entity('contract_obligations')
export class ContractObligation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.obligations)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ name: 'commitment_date', type: 'date', nullable: true })
  commitmentDate?: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'in_progress' | 'completed' | 'waived' | 'overdue';

  @Column({ name: 'evidence_document_id', nullable: true })
  evidenceDocumentId?: string;

  @ManyToOne(() => DocumentRecord, { nullable: true })
  @JoinColumn({ name: 'evidence_document_id' })
  evidenceDocument?: DocumentRecord;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'varchar', length: 20, default: 'once' })
  periodicity!: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority!: string;

  @Column({ type: 'text', nullable: true })
  consequence?: string;

  @Column({ type: 'int', nullable: true })
  periodicityDay?: number;

  @Column({ type: 'datetime', nullable: true })
  lastRemindedAt?: Date;

  @Column({ type: 'int', default: 0 })
  reminderCount!: number;

  @Column({ name: 'alert_days_before', nullable: true, default: 14 })
  alertDaysBefore?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
