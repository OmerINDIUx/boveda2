import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
@Unique(['userId', 'notificationType'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'notification_type', length: 80 })
  notificationType!: string;

  @Column({ name: 'in_app_enabled', default: true })
  inAppEnabled!: boolean;

  @Column({ name: 'email_enabled', default: true })
  emailEnabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
