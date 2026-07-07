import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contract } from '../contract.entity';
import { ContractCustomField } from './contract-custom-field.entity';

@Entity('contract_custom_values')
export class ContractCustomValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'field_id' })
  fieldId!: string;

  @ManyToOne(() => ContractCustomField)
  @JoinColumn({ name: 'field_id' })
  field!: ContractCustomField;

  @Column({ type: 'text', nullable: true })
  value?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
