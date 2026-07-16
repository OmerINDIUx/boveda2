import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Bitacora } from './bitacora.entity';

@Entity('bitacora_entries')
export class BitacoraEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bitacora_id' })
  bitacoraId!: string;

  @ManyToOne(() => Bitacora, (bitacora) => bitacora.entries)
  @JoinColumn({ name: 'bitacora_id' })
  bitacora!: Bitacora;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column()
  folio!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ length: 20, default: 'matutino' })
  turno!: string;

  @Column({ type: 'json', nullable: true })
  clima?: Record<string, unknown>;

  @Column({ name: 'descripcion_general', type: 'text', nullable: true })
  descripcionGeneral?: string;

  @Column({ type: 'json', nullable: true })
  actividades?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  personal?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  equipos?: Record<string, unknown>;

  @Column({ name: 'materiales_recibidos', type: 'json', nullable: true })
  materialesRecibidos?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  incidentes?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  seguridad?: string;

  @Column({ type: 'text', nullable: true })
  calidad?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'avance_estimado', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avanceEstimado?: number;

  @Column({ length: 20, default: 'borrador' })
  estado!: string;

  @Column({ name: 'firmado_por_id', nullable: true })
  firmadoPorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'firmado_por_id' })
  firmadoPor?: User;

  @Column({ name: 'firmado_en', type: 'datetime', nullable: true })
  firmadoEn?: Date;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
