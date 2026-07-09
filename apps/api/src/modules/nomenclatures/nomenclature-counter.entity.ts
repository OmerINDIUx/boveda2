import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { NomenclatureRule } from './nomenclature-rule.entity';
import { Project } from '../projects/project.entity';

@Entity('nomenclature_counters')
@Unique(['ruleId', 'year'])
export class NomenclatureCounter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rule_id' })
  ruleId!: string;

  @ManyToOne(() => NomenclatureRule)
  @JoinColumn({ name: 'rule_id' })
  rule!: NomenclatureRule;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column()
  year!: number;

  @Column({ name: 'current_number', default: 0 })
  currentNumber!: number;
}
