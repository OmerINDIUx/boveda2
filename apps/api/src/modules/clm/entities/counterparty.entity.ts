import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Contract } from '../contract.entity';

@Entity('counterparties')
export class Counterparty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  businessName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  commercialName!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  rfc!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  taxAddress!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  counterpartyType!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  riskLevel!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'boolean', default: false })
  isValidated!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Contract, (contract) => contract.supplierCounterparty)
  supplierContracts!: Contract[];

  @OneToMany(() => Contract, (contract) => contract.clientCounterparty)
  clientContracts!: Contract[];
}
