import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { RfiComment } from './rfi-comment.entity';
import { Rfi } from './rfi.entity';

@Entity('rfi_attachments')
export class RfiAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rfi_id' })
  rfiId!: string;

  @ManyToOne(() => Rfi, (rfi) => rfi.attachments)
  @JoinColumn({ name: 'rfi_id' })
  rfi!: Rfi;

  @Column({ name: 'comment_id', nullable: true })
  commentId?: string;

  @ManyToOne(() => RfiComment, (comment) => comment.attachments, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment?: RfiComment;

  @Column({ name: 'file_key' })
  fileKey!: string;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'uploaded_by_id' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
