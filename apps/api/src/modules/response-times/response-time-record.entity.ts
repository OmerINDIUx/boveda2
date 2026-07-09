import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SlaDefinition } from './sla-definition.entity';

@Entity('response_time_records')
export class ResponseTimeRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'email_id' })
  emailId!: string;

  @Column({ name: 'sla_id' })
  slaId!: string;

  @ManyToOne(() => SlaDefinition)
  @JoinColumn({ name: 'sla_id' })
  sla!: SlaDefinition;

  @Column({ name: 'started_at', type: 'datetime' })
  startedAt!: Date;

  @Column({ name: 'target_deadline', type: 'datetime' })
  targetDeadline!: Date;

  @Column({ name: 'responded_at', type: 'datetime', nullable: true })
  respondedAt?: Date;

  @Column({ length: 20, default: 'within_sla' })
  status!: string;

  @Column({ name: 'breach_notified', default: false })
  breachNotified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
