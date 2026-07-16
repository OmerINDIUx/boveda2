import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/project.entity';
@Entity('contract_requests')
export class ContractRequest {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 100 }) contractType!: string;
  @Column({ nullable: true }) projectId!: string;
  @ManyToOne(() => Project, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;
  @Column({ type: 'varchar', length: 255, nullable: true }) counterpartyName!: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) counterpartyRfc!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) counterpartyId!: string;
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true }) estimatedAmount!: number;
  @Column({ type: 'varchar', length: 3, default: 'MXN' }) currency!: string;
  @Column({ type: 'date', nullable: true }) startDate!: Date;
  @Column({ type: 'date', nullable: true }) endDate!: Date;
  @Column({ type: 'varchar', length: 160, nullable: true }) requestingArea!: string;
  @Column({ nullable: true }) responsibleUserId!: string;
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsibleUserId' })
  responsibleUser!: User;
  @Column({ type: 'varchar', length: 20, default: 'normal' }) urgencyLevel!: string;
  @Column({ type: 'varchar', length: 20, default: 'low' }) riskLevel!: string;
  @Column({ type: 'text', nullable: true }) description!: string;
  @Column({ type: 'text', nullable: true }) justification!: string;
  @Column({ type: 'varchar', length: 50, default: 'draft' }) status!: string;
  @Column({ nullable: true }) reviewedById!: string;
  @Column({ type: 'text', nullable: true }) reviewComments!: string;
  @Column({ type: 'datetime', nullable: true }) reviewedAt!: Date;
  @Column({ nullable: true }) createdById!: string;
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;
  @Column({ type: 'uuid', nullable: true }) convertedContractId!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
