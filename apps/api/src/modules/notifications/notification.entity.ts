import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ length: 160 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ default: 'system' })
  type!: string;

  @Column({ name: 'notification_type', length: 80, default: 'system' })
  notificationType!: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType?: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId?: string;

  @Column({ name: 'meta_json', type: 'text', nullable: true })
  metaJson?: string;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
