import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/project.entity';

@Entity('contract_import_logs')
export class ContractImportLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ name: 'total_rows', default: 0 })
  totalRows!: number;

  @Column({ name: 'success_rows', default: 0 })
  successRows!: number;

  @Column({ name: 'error_rows', default: 0 })
  errorRows!: number;

  @Column({ name: 'errors_json', type: 'json', nullable: true })
  errorsJson?: Array<{ row: number; message: string }>;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
