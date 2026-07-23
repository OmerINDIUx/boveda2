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
import { ContractAttachment } from '../contract-attachment.entity';

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

  @Column({ name: 'attachment_id', nullable: true })
  attachmentId?: string;

  @ManyToOne(() => ContractAttachment, { nullable: true })
  @JoinColumn({ name: 'attachment_id' })
  attachment?: ContractAttachment;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ name: 'raw_content', type: 'longtext', nullable: true })
  rawContent?: string;

  @Column({ name: 'normalization_method', length: 40, nullable: true })
  normalizationMethod?: string;

  @Column({ name: 'content_hash', length: 64, nullable: true })
  contentHash?: string;

  @Column({ name: 'page_number', nullable: true })
  pageNumber?: number;

  @Column({ name: 'chunk_index', nullable: true })
  chunkIndex?: number;

  @Column({ name: 'section_label', length: 255, nullable: true })
  sectionLabel?: string;

  @Column({ name: 'token_count', nullable: true })
  tokenCount?: number;

  @Column({ type: 'json', nullable: true })
  embedding?: number[];

  @Column({ name: 'ollama_embedding', type: 'json', nullable: true })
  ollamaEmbedding?: number[];

  @Column({ name: 'embedding_model', length: 120, nullable: true })
  embeddingModel?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
