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
import { ContractAttachment } from '../contract-attachment.entity';
import { ContractVersion } from '../contract-version.entity';

@Entity('contract_signature_requests')
export class ContractSignatureRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract, (c) => c.signatureRequests)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ name: 'version_id', nullable: true })
  versionId?: string;

  @ManyToOne(() => ContractVersion, { nullable: true })
  @JoinColumn({ name: 'version_id' })
  version?: ContractVersion;

  @Column({ name: 'attachment_id', nullable: true })
  attachmentId?: string;

  @ManyToOne(() => ContractAttachment, { nullable: true })
  @JoinColumn({ name: 'attachment_id' })
  attachment?: ContractAttachment;

  @Column({ length: 40, default: 'stub' })
  provider!: string;

  @Column({ name: 'provider_request_id', length: 255, nullable: true })
  providerRequestId?: string;

  @Column({ length: 40, default: 'pending' })
  status!: string;

  @Column({ name: 'signers_json', type: 'json' })
  signersJson!: Record<string, unknown>;

  @Column({ name: 'document_hash', length: 128, nullable: true })
  documentHash?: string;

  @Column({ name: 'signed_at', type: 'datetime', nullable: true })
  signedAt?: Date;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;

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
