import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contract_custom_fields')
export class ContractCustomField {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_type', length: 100 })
  contractType!: string;

  @Column({ name: 'field_key', length: 80 })
  fieldKey!: string;

  @Column({ name: 'field_label', length: 180 })
  fieldLabel!: string;

  @Column({ name: 'field_type', length: 40, default: 'string' })
  fieldType!: string;

  @Column({ default: false })
  required!: boolean;

  @Column({ name: 'options_json', type: 'json', nullable: true })
  optionsJson?: Record<string, unknown>;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
