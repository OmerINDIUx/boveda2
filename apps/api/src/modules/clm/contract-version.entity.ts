import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Contract } from './contract.entity';

@Entity('contract_versions')
export class ContractVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.versions)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'version_label', length: 40 })
  versionLabel!: string;

  @Column({ name: 'file_key' })
  fileKey!: string;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'file_extension', length: 30, nullable: true })
  fileExtension?: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'uploaded_by_id' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: User;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
