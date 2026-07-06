import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentChunk } from './document-chunk.entity';

@Entity('document_embeddings')
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chunk_id' })
  chunkId!: string;

  @ManyToOne(() => DocumentChunk, (chunk) => chunk.embeddings)
  @JoinColumn({ name: 'chunk_id' })
  chunk!: DocumentChunk;

  @Column({ length: 80 })
  provider!: string;

  @Column({ length: 120 })
  model!: string;

  @Column()
  dimensions!: number;

  @Column({ type: 'json' })
  embedding!: number[];

  @Column({ name: 'content_hash', length: 128 })
  contentHash!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
