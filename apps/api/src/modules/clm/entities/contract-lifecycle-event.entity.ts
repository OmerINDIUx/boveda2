import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { DocumentRecord } from '../../documents/document.entity';
import { Contract } from '../contract.entity';
import { ContractVersion } from '../contract-version.entity';
@Entity('contract_lifecycle_events')
export class ContractLifecycleEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'contract_id' }) contractId!: string;
  @ManyToOne(() => Contract, (contract) => contract.lifecycleEvents)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;
  @Column({ name: 'previous_stage', length: 80, nullable: true }) previousStage?: string;
  @Column({ name: 'stage', length: 80 }) stage!: string;
  @Column({ name: 'changed_by_id' }) changedById!: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'changed_by_id' }) changedBy!: User;
  @Column({ type: 'text', nullable: true }) comments?: string;
  @Column({ length: 120, nullable: true }) decision?: string;
  @Column({ name: 'related_document_id', nullable: true }) relatedDocumentId?: string;
  @ManyToOne(() => DocumentRecord, { nullable: true })
  @JoinColumn({ name: 'related_document_id' })
  relatedDocument?: DocumentRecord | null;
  @Column({ name: 'related_version_id', nullable: true }) relatedVersionId?: string;
  @ManyToOne(() => ContractVersion, { nullable: true })
  @JoinColumn({ name: 'related_version_id' })
  relatedVersion?: ContractVersion | null;
  @Column({ name: 'time_in_previous_stage_minutes', nullable: true })
  timeInPreviousStageMinutes?: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
