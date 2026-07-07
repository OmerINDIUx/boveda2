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

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string;

  @Column({ length: 3, default: 'MXN' })
  currency!: string;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ length: 40, default: 'pending' })
  status!: string;

  @Column({ name: 'invoice_number', length: 80, nullable: true })
  invoiceNumber?: string;

  @Column({ name: 'invoice_file_key', length: 255, nullable: true })
  invoiceFileKey?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

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
