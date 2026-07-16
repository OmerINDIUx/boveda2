import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BitacoraEntry } from './bitacora-entry.entity';

@Entity('bitacora_photos')
export class BitacoraPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entry_id' })
  entryId!: string;

  @ManyToOne(() => BitacoraEntry)
  @JoinColumn({ name: 'entry_id' })
  entry!: BitacoraEntry;

  @Column({ name: 'file_path', length: 500 })
  filePath!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ length: 30, default: 'general' })
  tipo!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
