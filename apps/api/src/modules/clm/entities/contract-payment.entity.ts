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
import { Contract } from '../contract.entity';

@Entity('contract_payments')
export class ContractPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (c) => c.payments)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ length: 200 })
  concept!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: string;

  @Column({ length: 3, default: 'MXN' })
  currency!: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  percentage?: string;

  @Column({ name: 'payment_condition', type: 'text', nullable: true })
  paymentCondition?: string;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate?: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string | null;

  @Column({ length: 40, default: 'pending' })
  status!: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 80, nullable: true })
  invoiceNumber?: string | null;

  @Column({ name: 'invoice_file_key', type: 'varchar', length: 255, nullable: true })
  invoiceFileKey?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'erp_external_id', type: 'varchar', length: 255, nullable: true })
  erpExternalId?: string | null;

  @Column({ name: 'erp_sync_status', type: 'varchar', length: 40, nullable: true })
  erpSyncStatus?: string | null;

  @Column({ name: 'erp_sync_error', type: 'text', nullable: true })
  erpSyncError?: string | null;

  @Column({ name: 'erp_synced_at', type: 'datetime', nullable: true })
  erpSyncedAt?: Date | null;

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
