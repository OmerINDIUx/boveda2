import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rfi } from './rfi.entity';
import { User } from '../users/user.entity';
import { RfiAttachment } from './rfi-attachment.entity';

@Entity('rfi_comments')
export class RfiComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rfi_id' })
  rfiId!: string;

  @ManyToOne(() => Rfi, (rfi) => rfi.comments)
  @JoinColumn({ name: 'rfi_id' })
  rfi!: Rfi;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  author!: User;

  @Column({ name: 'comment', type: 'text' })
  body!: string;

  @Column({ name: 'comment_type', default: 'comment' })
  type!: 'comment' | 'response' | 'system';

  @OneToMany(() => RfiAttachment, (attachment) => attachment.comment)
  attachments!: RfiAttachment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
