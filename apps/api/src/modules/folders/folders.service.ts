import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { Discipline } from './discipline.entity';
import { Folder } from './folder.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder) private readonly folders: Repository<Folder>,
    @InjectRepository(Discipline) private readonly disciplines: Repository<Discipline>,
    private readonly scope: AccessScopeService,
    private readonly audit: AuditService
  ) {}

  async list(userId: string, projectId: string) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    return this.folders.find({ where: { projectId } });
  }

  async create(userId: string, dto: CreateFolderDto) {
    if (!(await this.scope.canAccessProject(userId, dto.projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    const parent = dto.parentId
      ? await this.folders.findOne({ where: { id: dto.parentId, projectId: dto.projectId } })
      : null;
    const path = parent ? `${parent.path}/${dto.name}` : dto.name;
    const saved = await this.folders.save(
      this.folders.create({
        ...dto,
        path,
        createdById: userId,
      })
    );
    await this.audit.record({
      actorId: userId,
      action: 'folder.create',
      entityType: 'folder',
      entityId: saved.id,
      metadata: { projectId: dto.projectId, path },
    });
    return saved;
  }

  listDisciplines() {
    return this.disciplines.find({ order: { code: 'ASC', name: 'ASC' } });
  }

  async createDiscipline(userId: string, dto: CreateDisciplineDto) {
    const saved = await this.disciplines.save(
      this.disciplines.create({
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
      })
    );
    await this.audit.record({
      actorId: userId,
      action: 'discipline.create',
      entityType: 'discipline',
      entityId: saved.id,
      metadata: { code: saved.code, name: saved.name },
    });
    return saved;
  }

  async updateDiscipline(userId: string, id: string, dto: UpdateDisciplineDto) {
    const discipline = await this.disciplines.findOne({ where: { id } });
    if (!discipline) {
      throw new NotFoundException('Disciplina no encontrada');
    }

    if (dto.code !== undefined) discipline.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) discipline.name = dto.name.trim();
    if (dto.description !== undefined) discipline.description = dto.description.trim();

    const saved = await this.disciplines.save(discipline);
    await this.audit.record({
      actorId: userId,
      action: 'discipline.update',
      entityType: 'discipline',
      entityId: id,
      metadata: { ...dto },
    });
    return saved;
  }

  async deactivateDiscipline(userId: string, id: string) {
    const discipline = await this.disciplines.findOne({ where: { id } });
    if (!discipline) {
      throw new NotFoundException('Disciplina no encontrada');
    }

    await this.disciplines.softDelete(id);
    await this.audit.record({
      actorId: userId,
      action: 'discipline.deactivate',
      entityType: 'discipline',
      entityId: id,
    });
    return { ok: true, id };
  }
}
