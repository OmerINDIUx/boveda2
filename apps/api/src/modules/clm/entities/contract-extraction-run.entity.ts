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
import { ContractAttachment } from '../contract-attachment.entity';

export type ContractExtractionDecision = 'pending' | 'accepted' | 'rejected';

export type ContractExtractionFact = {
  id: string;
  category:
    | 'general'
    | 'dates'
    | 'parties'
    | 'penalties'
    | 'guarantees'
    | 'deliverables'
    | 'obligations'
    | 'payments'
    | 'milestones'
    | 'risks';
  field: string;
  label: string;
  value: string | number | boolean | Record<string, unknown>;
  confidence: number;
  pageNumber?: number;
  evidence?: string;
  decision: ContractExtractionDecision;
};

export type ContractExtractionBatchCheckpoint = {
  facts: ContractExtractionFact[];
  errors: string[];
  model?: string;
  completedAt: string;
};

export type ContractExtractionCheckpoint = {
  contentHash: string;
  stage: 'indexing_text' | 'extracting_facts' | 'draft_ready';
  totalBatches: number;
  batches: Record<string, ContractExtractionBatchCheckpoint>;
  savedAt: string;
};

@Entity('contract_extraction_runs')
export class ContractExtractionRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id' })
  contractId!: string;

  @ManyToOne(() => Contract)
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

  @Column({ name: 'uploaded_by_id' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: User;

  @Column({ length: 40, default: 'queued' })
  status!: 'queued' | 'processing' | 'draft_ready' | 'under_review' | 'approved' | 'failed';

  @Column({ type: 'json', nullable: true })
  facts?: ContractExtractionFact[];

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ name: 'progress_percent', type: 'int', default: 0 })
  progressPercent!: number;

  @Column({ name: 'processing_stage', length: 80, default: 'queued' })
  processingStage!: string;

  @Column({ name: 'pipeline_version', length: 40, default: 'contract-v1' })
  pipelineVersion!: string;

  @Column({ name: 'model_name', length: 120, nullable: true })
  modelName?: string;

  @Column({ name: 'content_hash', length: 128, nullable: true })
  contentHash?: string;

  @Column({ type: 'json', nullable: true })
  checkpoint?: ContractExtractionCheckpoint;

  @Column({ name: 'processed_at', type: 'datetime', nullable: true })
  processedAt?: Date;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
