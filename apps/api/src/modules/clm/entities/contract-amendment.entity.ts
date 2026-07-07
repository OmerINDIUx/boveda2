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

@Entity('contract_amendments')
export class ContractAmendment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (c) => c.amendments)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'amendment_number', length: 40 })
  amendmentNumber!: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'amendment_date', type: 'date' })
  amendmentDate!: string;

  @Column({ length: 40, default: 'draft' })
  status!: string;

  @Column({ name: 'file_key', length: 255, nullable: true })
  fileKey?: string;

  @Column({ name: 'file_name', length: 255, nullable: true })
  fileName?: string;

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
