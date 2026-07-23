import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { ContractAuditLog } from './contract-audit-log.entity';
import { Contract } from './contract.entity';
import {
  ContractRecordActionDto,
  CreateContractRecordDto,
  UpdateContractRecordDto,
} from './dto/contract-record.dto';
import { ContractRecordAction } from './entities/contract-record-action.entity';
import {
  CONTRACT_RECORD_TYPES,
  ContractRecord,
  ContractRecordType,
} from './entities/contract-record.entity';

@Injectable()
export class ContractRecordsService {
  constructor(
    @InjectRepository(Contract) private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractRecord) private readonly records: Repository<ContractRecord>,
    @InjectRepository(ContractRecordAction)
    private readonly actions: Repository<ContractRecordAction>,
    @InjectRepository(ContractAuditLog) private readonly audit: Repository<ContractAuditLog>,
    private readonly scope: AccessScopeService
  ) {}

  private async requireContract(userId: string, contractId: string) {
    const contract = await this.contracts.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    if (!(await this.scope.canAccessProject(userId, contract.projectId))) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }
    return contract;
  }

  private async requireRecord(userId: string, contractId: string, recordId: string) {
    await this.requireContract(userId, contractId);
    const record = await this.records.findOne({
      where: { id: recordId, contractId },
      relations: {
        responsibleUser: true,
        parentRecord: true,
        relatedAmendment: true,
        actions: { actor: true },
      },
    });
    if (!record) throw new NotFoundException('Registro contractual no encontrado');
    return record;
  }

  async list(userId: string, contractId: string, recordType?: ContractRecordType) {
    await this.requireContract(userId, contractId);
    if (recordType && !CONTRACT_RECORD_TYPES.includes(recordType)) {
      throw new BadRequestException('Tipo de registro contractual no válido');
    }
    return this.records.find({
      where: { contractId, ...(recordType ? { recordType } : {}) },
      relations: {
        responsibleUser: true,
        parentRecord: true,
        relatedAmendment: true,
        actions: { actor: true },
      },
      order: { eventDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(userId: string, contractId: string, dto: CreateContractRecordDto) {
    await this.requireContract(userId, contractId);
    if (dto.parentRecordId) {
      const parent = await this.records.findOne({ where: { id: dto.parentRecordId, contractId } });
      if (!parent)
        throw new BadRequestException('El registro relacionado no pertenece al contrato');
    }
    const duplicate = await this.records.findOne({
      where: { contractId, recordType: dto.recordType, recordNumber: dto.recordNumber },
    });
    if (duplicate)
      throw new BadRequestException('Ya existe un registro de este tipo con el mismo folio');

    const record = await this.records.save(
      this.records.create({
        ...dto,
        currency: dto.currency ?? 'MXN',
        status: dto.status ?? 'draft',
        approvalStatus: 'not_submitted',
        contractId,
        createdById: userId,
      })
    );
    await this.addAction(record.id, userId, 'created');
    await this.log(contractId, userId, 'create_contract_record', {
      recordId: record.id,
      recordType: record.recordType,
    });
    return this.requireRecord(userId, contractId, record.id);
  }

  async update(userId: string, contractId: string, recordId: string, dto: UpdateContractRecordDto) {
    const record = await this.requireRecord(userId, contractId, recordId);
    if (record.approvalStatus === 'approved') {
      throw new BadRequestException(
        'Un registro aprobado no puede modificarse; crea un registro relacionado'
      );
    }
    const before = { ...record };
    Object.assign(record, dto);
    const saved = await this.records.save(record);
    await this.addAction(record.id, userId, 'updated');
    await this.log(contractId, userId, 'update_contract_record', {
      recordId,
      recordType: record.recordType,
      before: { status: before.status, amount: before.amount, dueDate: before.dueDate },
      after: { status: saved.status, amount: saved.amount, dueDate: saved.dueDate },
    });
    return this.requireRecord(userId, contractId, recordId);
  }

  async submit(userId: string, contractId: string, recordId: string, dto: ContractRecordActionDto) {
    const record = await this.requireRecord(userId, contractId, recordId);
    if (!['not_submitted', 'rejected', 'changes_requested'].includes(record.approvalStatus)) {
      throw new BadRequestException('El registro ya fue enviado a aprobación');
    }
    record.approvalStatus = 'pending';
    record.status = 'pending_approval';
    await this.records.save(record);
    await this.addAction(record.id, userId, 'submitted', dto.comment);
    await this.log(contractId, userId, 'submit_contract_record', {
      recordId,
      recordType: record.recordType,
    });
    return this.requireRecord(userId, contractId, recordId);
  }

  async decide(
    userId: string,
    contractId: string,
    recordId: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    dto: ContractRecordActionDto
  ) {
    const record = await this.requireRecord(userId, contractId, recordId);
    if (record.approvalStatus !== 'pending') {
      throw new BadRequestException('El registro no está pendiente de aprobación');
    }
    record.approvalStatus = decision;
    record.status = decision === 'approved' ? 'approved' : decision;
    await this.records.save(record);
    await this.addAction(record.id, userId, decision, dto.comment);
    await this.log(contractId, userId, `${decision}_contract_record`, {
      recordId,
      recordType: record.recordType,
      comment: dto.comment,
    });
    return this.requireRecord(userId, contractId, recordId);
  }

  private async addAction(recordId: string, actorId: string, action: string, comment?: string) {
    await this.actions.save(this.actions.create({ recordId, actorId, action, comment }));
  }

  private async log(
    contractId: string,
    actorId: string,
    action: string,
    afterState: Record<string, unknown>
  ) {
    await this.audit.save(this.audit.create({ contractId, actorId, action, afterState }));
  }
}
