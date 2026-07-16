import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Counterparty } from './counterparty.entity';
@Entity('counterparty_documents')
export class CounterpartyDocument {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() counterpartyId!: string;
  @ManyToOne(() => Counterparty, (c) => c.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counterpartyId' })
  counterparty!: Counterparty;
  @Column({ type: 'varchar', length: 100 }) documentType!: string;
  @Column({ type: 'varchar', length: 255 }) fileName!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) fileKey!: string;
  @Column({ type: 'date', nullable: true }) expirationDate!: Date;
  @Column({ type: 'boolean', default: false }) isValid!: boolean;
  @CreateDateColumn() createdAt!: Date;
}
