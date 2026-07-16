import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Counterparty } from './counterparty.entity';
@Entity('counterparty_contacts')
export class CounterpartyContact {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() counterpartyId!: string;
  @ManyToOne(() => Counterparty, (c) => c.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counterpartyId' })
  counterparty!: Counterparty;
  @Column({ type: 'varchar', length: 180 }) name!: string;
  @Column({ type: 'varchar', length: 180, nullable: true }) email!: string;
  @Column({ type: 'varchar', length: 30, nullable: true }) phone!: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) position!: string;
  @Column({ type: 'boolean', default: false }) isLegalRepresentative!: boolean;
  @CreateDateColumn() createdAt!: Date;
}
