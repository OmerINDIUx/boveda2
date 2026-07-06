import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification_deliveries')
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'notification_type', length: 80 })
  notificationType!: string;

  @Column({ length: 20 })
  channel!: 'in_app' | 'email';

  @Column({ length: 20, default: 'sent' })
  status!: 'sent' | 'failed' | 'skipped';

  @Column({ length: 200, nullable: true })
  subject?: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType?: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId?: string;

  @Column({ name: 'dedupe_key', length: 190, nullable: true })
  dedupeKey?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
