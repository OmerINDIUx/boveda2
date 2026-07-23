import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { ContractAmendment } from './entities/contract-amendment.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractLifecycleEvent } from './entities/contract-lifecycle-event.entity';
import { ContractTextIndex } from './entities/contract-text-index.entity';
import { ContractComment } from './contract-comment.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractNegotiation } from './entities/contract-negotiation.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractPayment } from './entities/contract-payment.entity';
import { ContractSignatureRequest } from './entities/contract-signature-request.entity';
import { ContractVersion } from './contract-version.entity';
import { Tag } from './entities/tag.entity';
import { Counterparty } from './entities/counterparty.entity';
import { ContractDeliverable } from './entities/contract-deliverable.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ length: 180 })
  name!: string;

  @Column({ name: 'supplier_name', length: 180, nullable: true })
  supplierName?: string;

  @Column({ name: 'client_name', length: 180, nullable: true })
  clientName?: string;

  @Column({ name: 'responsible_area', length: 160, nullable: true })
  responsibleArea?: string;

  @Column({ name: 'contract_type', length: 100, nullable: true })
  contractType?: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string;

  @Column({ name: 'renewal_date', type: 'date', nullable: true })
  renewalDate?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: string;

  @Column({ length: 3, default: 'MXN' })
  currency!: string;

  @Column({ default: 'draft' })
  status!:
    | 'draft'
    | 'in_review'
    | 'approved'
    | 'active'
    | 'expiring_soon'
    | 'expired'
    | 'renewed'
    | 'closed';

  @Column({ name: 'lifecycle_stage', length: 80, default: 'request' })
  lifecycleStage!: string;

  @Column({ name: 'lifecycle_changed_at', type: 'datetime', nullable: true })
  lifecycleChangedAt?: Date;

  @Column({ name: 'responsible_user_id', nullable: true })
  responsibleUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsible_user_id' })
  responsibleUser?: User;

  @Column({ name: 'main_document_id', nullable: true })
  mainDocumentId?: string;

  @ManyToOne(() => DocumentRecord, { nullable: true })
  @JoinColumn({ name: 'main_document_id' })
  mainDocument?: DocumentRecord;

  @Column({ name: 'current_version_id', nullable: true })
  currentVersionId?: string;

  @Column({ default: false })
  renewable!: boolean;

  @Column({ name: 'renewal_notice_days', nullable: true })
  renewalNoticeDays?: number;

  @Column({ name: 'alert_days_before', nullable: true, default: 30 })
  alertDaysBefore?: number;

  @Column({ name: 'parent_contract_id', nullable: true })
  parentContractId?: string;

  @ManyToOne(() => Contract, { nullable: true })
  @JoinColumn({ name: 'parent_contract_id' })
  parentContract?: Contract;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true })
  closedAt?: Date;

  @Column({ name: 'close_reason', type: 'text', nullable: true })
  closeReason?: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @OneToMany(() => ContractVersion, (version) => version.contract)
  versions!: ContractVersion[];

  @OneToMany(() => ContractObligation, (obligation) => obligation.contract)
  obligations!: ContractObligation[];

  @OneToMany(() => ContractMilestone, (milestone) => milestone.contract)
  milestones!: ContractMilestone[];

  @OneToMany(() => ContractDeliverable, (deliverable) => deliverable.contract)
  deliverables!: ContractDeliverable[];

  @OneToMany(() => ContractAttachment, (attachment) => attachment.contract)
  attachments!: ContractAttachment[];

  @OneToMany(() => ContractComment, (comment) => comment.contract)
  comments!: ContractComment[];

  @OneToMany(() => ContractAuditLog, (log) => log.contract)
  auditLogs!: ContractAuditLog[];

  @OneToMany(() => ContractTextIndex, (ti) => ti.contract)
  textIndexes!: ContractTextIndex[];

  @OneToMany(() => ContractLifecycleEvent, (event) => event.contract)
  lifecycleEvents!: ContractLifecycleEvent[];

  @OneToMany(() => ContractAmendment, (amendment) => amendment.contract)
  amendments!: ContractAmendment[];

  @OneToMany(() => ContractPayment, (payment) => payment.contract)
  payments!: ContractPayment[];

  @OneToMany(() => ContractSignatureRequest, (sr) => sr.contract)
  signatureRequests!: ContractSignatureRequest[];

  @OneToMany(() => ContractNegotiation, (neg) => neg.contract)
  negotiations!: ContractNegotiation[];

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'contract_tags',
    joinColumn: { name: 'contract_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @Column({ type: 'varchar', length: 20, nullable: true })
  riskLevel?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  counterpartyRfc?: string;

  @Column({ type: 'uuid', nullable: true })
  supplierCounterpartyId?: string;

  @ManyToOne(() => Counterparty, { nullable: true })
  @JoinColumn({ name: 'supplierCounterpartyId' })
  supplierCounterparty?: Counterparty;

  @Column({ type: 'uuid', nullable: true })
  clientCounterpartyId?: string;

  @ManyToOne(() => Counterparty, { nullable: true })
  @JoinColumn({ name: 'clientCounterpartyId' })
  clientCounterparty?: Counterparty;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
