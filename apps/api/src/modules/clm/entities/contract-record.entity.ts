import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Contract } from '../contract.entity';
import { ContractAmendment } from './contract-amendment.entity';
import { ContractRecordAction } from './contract-record-action.entity';

export const CONTRACT_RECORD_TYPES = [
  'change_order',
  'claim',
  'dispute',
  'escalation',
  'penalty',
  'guarantee',
  'risk',
  'retention',
  'release',
] as const;

export type ContractRecordType = (typeof CONTRACT_RECORD_TYPES)[number];

@Entity('contract_records')
export class ContractRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'record_type', length: 40 })
  recordType!: ContractRecordType;

  @Column({ name: 'record_number', length: 60 })
  recordNumber!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, default: 'draft' })
  status!: string;

  @Column({ name: 'approval_status', length: 40, default: 'not_submitted' })
  approvalStatus!: 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

  @Column({ name: 'event_date', type: 'date', nullable: true })
  eventDate?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: string;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  approvedAmount?: string;

  @Column({ length: 3, default: 'MXN' })
  currency!: string;

  @Column({ name: 'impact_days', type: 'int', nullable: true })
  impactDays?: number;

  @Column({ name: 'approved_impact_days', type: 'int', nullable: true })
  approvedImpactDays?: number;

  @Column({ length: 180, nullable: true })
  counterparty?: string;

  @Column({ name: 'basis_clause', type: 'text', nullable: true })
  basisClause?: string;

  @Column({ type: 'text', nullable: true })
  calculation?: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  percentage?: string;

  @Column({ length: 180, nullable: true })
  issuer?: string;

  @Column({ length: 180, nullable: true })
  beneficiary?: string;

  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom?: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil?: string;

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ name: 'parent_record_id', nullable: true })
  parentRecordId?: string;

  @ManyToOne(() => ContractRecord, { nullable: true })
  @JoinColumn({ name: 'parent_record_id' })
  parentRecord?: ContractRecord;

  @Column({ name: 'related_amendment_id', nullable: true })
  relatedAmendmentId?: string;

  @ManyToOne(() => ContractAmendment, { nullable: true })
  @JoinColumn({ name: 'related_amendment_id' })
  relatedAmendment?: ContractAmendment;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @OneToMany(() => ContractRecordAction, (action) => action.record)
  actions!: ContractRecordAction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
