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

@Entity('contract_milestones')
export class ContractMilestone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.milestones)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ length: 180 })
  name!: string;

  @Column({ name: 'milestone_date', type: 'date' })
  milestoneDate!: string;

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ length: 40, default: 'pending' })
  status!: string;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ name: 'evidence_document_id', nullable: true })
  evidenceDocumentId?: string;

  @ManyToOne(() => DocumentRecord, { nullable: true })
  @JoinColumn({ name: 'evidence_document_id' })
  evidenceDocument?: DocumentRecord;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'alert_days_before', nullable: true, default: 7 })
  alertDaysBefore?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
