import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contract } from '../contract.entity';
import { ContractVersion } from '../contract-version.entity';

@Entity('contract_text_index')
export class ContractTextIndex {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (c) => c.textIndexes)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'version_id', nullable: true })
  versionId?: string;

  @ManyToOne(() => ContractVersion, { nullable: true })
  @JoinColumn({ name: 'version_id' })
  version?: ContractVersion;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ name: 'content_hash', length: 64, nullable: true })
  contentHash?: string;

  @Column({ name: 'page_number', nullable: true })
  pageNumber?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
