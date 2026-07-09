import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NomenclatureRule } from './nomenclature-rule.entity';
import { NomenclatureCounter } from './nomenclature-counter.entity';
import { CreateNomenclatureDto, UpdateNomenclatureDto } from './dto/create-nomenclature.dto';

@Injectable()
export class NomenclaturesService {
  private readonly logger = new Logger(NomenclaturesService.name);

  constructor(
    @InjectRepository(NomenclatureRule)
    private readonly rules: Repository<NomenclatureRule>,
    @InjectRepository(NomenclatureCounter)
    private readonly counters: Repository<NomenclatureCounter>
  ) {}

  async list(projectId: string) {
    return this.rules.find({
      where: { projectId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getById(id: string) {
    const rule = await this.rules.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Regla de nomenclatura no encontrada');
    return rule;
  }

  async create(dto: CreateNomenclatureDto, userId: string) {
    const rule = this.rules.create({
      projectId: dto.projectId,
      name: dto.name,
      pattern: dto.pattern,
      segments: dto.segments,
      createdById: userId,
    });
    return this.rules.save(rule);
  }

  async update(id: string, dto: UpdateNomenclatureDto) {
    const rule = await this.getById(id);
    if (dto.name !== undefined) rule.name = dto.name;
    if (dto.pattern !== undefined) rule.pattern = dto.pattern;
    if (dto.segments !== undefined) rule.segments = dto.segments;
    return this.rules.save(rule);
  }

  async remove(id: string) {
    const rule = await this.getById(id);
    await this.rules.softRemove(rule);
    return { ok: true };
  }

  async preview(ruleId: string, context: Record<string, string>) {
    const rule = await this.getById(ruleId);
    let result = rule.pattern;

    for (const segment of rule.segments) {
      let value = '';
      switch (segment.type) {
        case 'project_code':
          value = context.projectCode ?? 'XXXX';
          break;
        case 'discipline':
          value = context.discipline ?? 'GEN';
          break;
        case 'sequential':
          value = await this.getNextSequence(ruleId, context.projectId ?? '');
          break;
        case 'year':
          value = new Date().getFullYear().toString();
          break;
        case 'month':
          value = (new Date().getMonth() + 1).toString().padStart(2, '0');
          break;
        case 'text':
          value = segment.value ?? '';
          break;
      }
      if (segment.padding && !isNaN(Number(value))) {
        value = value.padStart(segment.padding, '0');
      }
      result = result.replace(`{${segment.type}}`, value);
    }

    return { preview: result };
  }

  private async getNextSequence(ruleId: string, projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    let counter = await this.counters.findOne({ where: { ruleId, year } });

    if (!counter) {
      counter = this.counters.create({ ruleId, projectId, year, currentNumber: 1 });
    } else {
      counter.currentNumber += 1;
    }

    await this.counters.save(counter);
    return counter.currentNumber.toString();
  }
}
