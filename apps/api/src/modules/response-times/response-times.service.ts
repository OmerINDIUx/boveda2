import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SlaDefinition } from './sla-definition.entity';
import { ResponseTimeRecord } from './response-time-record.entity';
import { EmailWorkflowAction } from './email-workflow-action.entity';
import { CreateSlaDto, UpdateSlaDto, CreateWorkflowActionDto } from './dto/sla.dto';

type MetricsAggregateRow = {
  avg: string | null;
};

@Injectable()
export class ResponseTimesService {
  constructor(
    @InjectRepository(SlaDefinition)
    private readonly slas: Repository<SlaDefinition>,
    @InjectRepository(ResponseTimeRecord)
    private readonly records: Repository<ResponseTimeRecord>,
    @InjectRepository(EmailWorkflowAction)
    private readonly workflows: Repository<EmailWorkflowAction>
  ) {}

  async listSlas(projectId: string) {
    return this.slas.find({ where: { projectId, isActive: true }, order: { name: 'ASC' } });
  }

  async createSla(dto: CreateSlaDto) {
    return this.slas.save(this.slas.create(dto));
  }

  async updateSla(id: string, dto: UpdateSlaDto) {
    const sla = await this.slas.findOne({ where: { id } });
    if (!sla) throw new NotFoundException('SLA no encontrado');
    Object.assign(sla, dto);
    return this.slas.save(sla);
  }

  async getMetrics(projectId: string) {
    const slas = await this.slas.find({ where: { projectId, isActive: true } });
    const slaIds = slas.map((s) => s.id);

    const totalRecords = slaIds.length
      ? await this.records.count({ where: { slaId: In(slaIds) } })
      : 0;
    const withinSla = await this.records.count({ where: { status: 'within_sla' } });
    const breached = await this.records.count({ where: { status: 'breached' } });
    const warning = await this.records.count({ where: { status: 'warning' } });

    const avgResponse = await this.records
      .createQueryBuilder('r')
      .select('AVG(TIMESTAMPDIFF(HOUR, r.startedAt, r.respondedAt))', 'avg')
      .where('r.respondedAt IS NOT NULL')
      .getRawOne<MetricsAggregateRow>();

    return {
      totalSlas: slas.length,
      totalRecords,
      withinSla,
      breached,
      warning,
      avgResponseHours: avgResponse?.avg ? Number(avgResponse.avg).toFixed(2) : null,
    };
  }

  async listWorkflows(projectId: string) {
    return this.workflows.find({ where: { projectId, isActive: true } });
  }

  async createWorkflow(dto: CreateWorkflowActionDto) {
    return this.workflows.save(this.workflows.create(dto));
  }

  async checkSlaStatus(emailId: string, slaId: string) {
    const sla = await this.slas.findOne({ where: { id: slaId } });
    if (!sla) throw new NotFoundException('SLA no encontrado');

    const record = await this.records.findOne({ where: { emailId, slaId } });
    if (!record) return { status: 'unknown' };

    const now = new Date();
    if (record.respondedAt) {
      return { status: 'responded', respondedAt: record.respondedAt };
    }
    if (now > record.targetDeadline) {
      return { status: 'breached', deadline: record.targetDeadline };
    }
    if (
      sla.warningHours &&
      now > new Date(record.startedAt.getTime() + sla.warningHours * 3600000)
    ) {
      return { status: 'warning', deadline: record.targetDeadline };
    }
    return { status: 'within_sla', deadline: record.targetDeadline };
  }
}
