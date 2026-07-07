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
import { ContractVersion } from '../contract-version.entity';

@Entity('contract_negotiations')
export class ContractNegotiation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (c) => c.negotiations)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'version_id', nullable: true })
  versionId?: string;

  @ManyToOne(() => ContractVersion, { nullable: true })
  @JoinColumn({ name: 'version_id' })
  version?: ContractVersion;

  @Column({ name: 'party_name', length: 160 })
  partyName!: string;

  @Column({ type: 'text', nullable: true })
  proposedText?: string;

  @Column({ name: 'original_text', type: 'text', nullable: true })
  originalText?: string;

  @Column({ length: 40, default: 'proposed' })
  status!: string;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt?: Date;

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
