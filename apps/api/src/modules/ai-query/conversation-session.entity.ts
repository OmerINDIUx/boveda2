import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('conversation_sessions')
export class ConversationSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId!: string;

  @Column({ name: 'project_id', type: 'char', length: 36, nullable: true })
  projectId?: string;

  @Column({ name: 'document_id', type: 'char', length: 36, nullable: true })
  documentId?: string;

  @Column({ length: 255, nullable: true })
  name?: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
