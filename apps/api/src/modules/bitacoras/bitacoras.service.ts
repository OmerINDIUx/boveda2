import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { Bitacora } from './bitacora.entity';
import { BitacoraEntry } from './bitacora-entry.entity';
import { BitacoraPhoto } from './bitacora-photo.entity';
import { BitacoraHistory } from './bitacora-history.entity';
import { CreateBitacoraEntryDto, PhotoInputDto } from './dto/create-bitacora-entry.dto';
import { UpdateBitacoraEntryDto } from './dto/update-bitacora-entry.dto';
import { BitacoraListQueryDto } from './dto/bitacora-list-query.dto';
import { SignBitacoraEntryDto } from './dto/sign-bitacora-entry.dto';

@Injectable()
export class BitacorasService {
  private readonly logger = new Logger(BitacorasService.name);

  constructor(
    @InjectRepository(Bitacora) private readonly bitacoras: Repository<Bitacora>,
    @InjectRepository(BitacoraEntry) private readonly entries: Repository<BitacoraEntry>,
    @InjectRepository(BitacoraPhoto) private readonly photos: Repository<BitacoraPhoto>,
    @InjectRepository(BitacoraHistory) private readonly history: Repository<BitacoraHistory>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly scope: AccessScopeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService
  ) {}

  async getOrCreateBitacora(projectId: string) {
    let bitacora = await this.bitacoras.findOne({ where: { projectId } });
    if (!bitacora) {
      bitacora = await this.bitacoras.save(this.bitacoras.create({ projectId, folioActual: 0 }));
    }
    return bitacora;
  }

  async listEntries(user: RequestUser, query: BitacoraListQueryDto) {
    const visibleProjectIds = await this.resolveVisibleProjectIds(user.id, query.projectId);
    if (!visibleProjectIds.length) return [];

    const builder = this.entries
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.bitacora', 'bitacora')
      .leftJoinAndSelect('entry.project', 'project')
      .leftJoinAndSelect('entry.createdBy', 'createdBy')
      .leftJoinAndSelect('entry.firmadoPor', 'firmadoPor')
      .where('entry.projectId IN (:...projectIds)', { projectIds: visibleProjectIds })
      .orderBy('entry.fecha', 'DESC')
      .addOrderBy('entry.folio', 'DESC');

    if (query.estado) {
      builder.andWhere('entry.estado = :estado', { estado: query.estado });
    }
    if (query.turno) {
      builder.andWhere('entry.turno = :turno', { turno: query.turno });
    }
    if (query.fechaDesde) {
      builder.andWhere('entry.fecha >= :fechaDesde', { fechaDesde: query.fechaDesde });
    }
    if (query.fechaHasta) {
      builder.andWhere('entry.fecha <= :fechaHasta', { fechaHasta: query.fechaHasta });
    }

    const items = await builder.getMany();
    return items.map((item) => this.serializeListItem(item));
  }

  async getDetail(user: RequestUser, entryId: string) {
    const entry = await this.entries.findOne({
      where: { id: entryId },
      relations: ['bitacora', 'project', 'createdBy', 'firmadoPor'],
    });
    if (!entry) throw new NotFoundException('Entrada de bitácora no encontrada');
    await this.assertAccess(user.id, entry.projectId);
    return this.serializeDetail(entry);
  }

  async create(user: RequestUser, dto: CreateBitacoraEntryDto) {
    await this.assertAccess(user.id, dto.projectId);
    const bitacora = await this.getOrCreateBitacora(dto.projectId);
    const folio = bitacora.folioActual + 1;

    const entry = await this.entries.save(
      this.entries.create({
        bitacoraId: bitacora.id,
        projectId: dto.projectId,
        folio,
        fecha: dto.fecha,
        turno: dto.turno ?? 'matutino',
        clima: dto.clima,
        descripcionGeneral: dto.descripcionGeneral,
        actividades: dto.actividades,
        personal: dto.personal,
        equipos: dto.equipos,
        materialesRecibidos: dto.materialesRecibidos,
        incidentes: dto.incidentes,
        seguridad: dto.seguridad,
        calidad: dto.calidad,
        observaciones: dto.observaciones,
        avanceEstimado: dto.avanceEstimado,
        estado: 'borrador',
        createdById: user.id,
      })
    );

    bitacora.folioActual = folio;
    await this.bitacoras.save(bitacora);

    if (dto.fotos?.length) {
      await this.createPhotos(entry.id, user.id, dto.fotos);
    }

    await this.logHistory(entry.id, user.id, 'created', undefined, this.snapshot(entry));

    return this.getDetail(user, entry.id);
  }

  async update(user: RequestUser, entryId: string, dto: UpdateBitacoraEntryDto) {
    await this.assertEntryAccess(user.id, entryId);
    if (entry.estado !== 'borrador') {
      throw new ForbiddenException('Solo se pueden editar entradas en estado borrador');
    }
    if (entry.createdById !== user.id) {
      throw new ForbiddenException('Solo el creador puede editar la entrada');
    }

    const before = this.snapshot(entry);
    Object.assign(entry, {
      fecha: dto.fecha ?? entry.fecha,
      turno: dto.turno ?? entry.turno,
      clima: dto.clima ?? entry.clima,
      descripcionGeneral: dto.descripcionGeneral ?? entry.descripcionGeneral,
      actividades: dto.actividades ?? entry.actividades,
      personal: dto.personal ?? entry.personal,
      equipos: dto.equipos ?? entry.equipos,
      materialesRecibidos: dto.materialesRecibidos ?? entry.materialesRecibidos,
      incidentes: dto.incidentes ?? entry.incidentes,
      seguridad: dto.seguridad ?? entry.seguridad,
      calidad: dto.calidad ?? entry.calidad,
      observaciones: dto.observaciones ?? entry.observaciones,
      avanceEstimado: dto.avanceEstimado ?? entry.avanceEstimado,
    });
    await this.entries.save(entry);

    if (dto.fotos?.length) {
      await this.createPhotos(entry.id, user.id, dto.fotos);
    }

    await this.logHistory(entry.id, user.id, 'updated', before, this.snapshot(entry));
    return this.getDetail(user, entryId);
  }

  async sign(user: RequestUser, entryId: string, dto: SignBitacoraEntryDto) {
    await this.assertEntryAccess(user.id, entryId);
    if (entry.estado !== 'borrador') {
      throw new ForbiddenException('La entrada ya está firmada o cerrada');
    }

    const before = this.snapshot(entry);
    entry.estado = 'firmado';
    entry.firmadoPorId = user.id;
    entry.firmadoEn = new Date();
    if (dto.observaciones) {
      entry.observaciones = entry.observaciones
        ? `${entry.observaciones}\n\n[Firma] ${dto.observaciones}`
        : `[Firma] ${dto.observaciones}`;
    }
    await this.entries.save(entry);

    await this.logHistory(entry.id, user.id, 'signed', before, this.snapshot(entry));

    return this.getDetail(user, entryId);
  }

  async delete(user: RequestUser, entryId: string) {
    const entry = await this.assertEntryAccess(user.id, entryId);
    if (entry.estado !== 'borrador') {
      throw new ForbiddenException('Solo se pueden eliminar entradas en estado borrador');
    }
    await this.entries.softRemove(entry);
    await this.logHistory(entry.id, user.id, 'deleted', this.snapshot(entry), undefined);
    return { ok: true };
  }

  async uploadPhoto(user: RequestUser, entryId: string, file: PhotoInputDto) {
    await this.assertEntryAccess(user.id, entryId);
    const cleanBase64 = file.base64Content.includes(',')
      ? file.base64Content.split(',')[1]
      : file.base64Content;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const stored = await this.storage.put(buffer, file.fileName, file.mimeType);
    const photo = await this.photos.save(
      this.photos.create({
        entryId,
        filePath: stored.fileKey,
        descripcion: file.descripcion,
        tipo: file.tipo ?? 'general',
      })
    );
    return photo;
  }

  async deletePhoto(user: RequestUser, entryId: string, photoId: string) {
    await this.assertEntryAccess(user.id, entryId);
    const photo = await this.photos.findOne({ where: { id: photoId, entryId } });
    if (!photo) throw new NotFoundException('Foto no encontrada');
    await this.photos.remove(photo);
    return { ok: true };
  }

  async getReport(
    user: RequestUser,
    projectId: string,
    tipo: 'semanal' | 'mensual',
    fecha: string
  ) {
    await this.assertAccess(user.id, projectId);
    const date = new Date(fecha);
    let desde: Date;
    let hasta: Date;

    if (tipo === 'semanal') {
      const dayOfWeek = date.getDay();
      desde = new Date(date);
      desde.setDate(desde.getDate() - dayOfWeek);
      hasta = new Date(desde);
      hasta.setDate(hasta.getDate() + 6);
    } else {
      desde = new Date(date.getFullYear(), date.getMonth(), 1);
      hasta = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    const desdeStr = desde.toISOString().slice(0, 10);
    const hastaStr = hasta.toISOString().slice(0, 10);

    const entries = await this.entries.find({
      where: {
        projectId,
        fecha: Between(desdeStr, hastaStr),
      },
      relations: ['createdBy', 'firmadoPor'],
      order: { fecha: 'ASC', folio: 'ASC' },
    });

    const totalEntries = entries.length;
    const signedEntries = entries.filter(
      (e) => e.estado === 'firmado' || e.estado === 'cerrado'
    ).length;
    const avgAvance =
      entries.reduce((sum, e) => sum + (Number(e.avanceEstimado) || 0), 0) / (totalEntries || 1);
    const incidentes = entries.flatMap((e) => {
      const inc = e.incidentes as unknown as Array<Record<string, unknown>> | null;
      return inc ?? [];
    });

    return {
      tipo,
      desde: desdeStr,
      hasta: hastaStr,
      totalEntradas: totalEntries,
      entradasFirmadas: signedEntries,
      avancePromedio: Math.round(avgAvance * 100) / 100,
      totalIncidentes: incidentes.length,
      incidentes,
      entries: entries.map((e) => this.serializeListItem(e)),
    };
  }

  async exportPdf(user: RequestUser, entryId: string) {
    const entry = await this.assertEntryAccess(user.id, entryId);
    const photos = await this.photos.find({ where: { entryId } });

    const html = this.buildPdfHtml(entry, photos);
    return { html, filename: `bitacora-${entry.folio}-${entry.fecha}.html` };
  }

  private buildPdfHtml(entry: BitacoraEntry, photos: BitacoraPhoto[]) {
    const clima = entry.clima as Record<string, unknown> | null;
    const actividades = entry.actividades as unknown as Array<Record<string, unknown>> | null;
    const personal = entry.personal as unknown as Array<Record<string, unknown>> | null;
    const equipos = entry.equipos as unknown as Array<Record<string, unknown>> | null;
    const materiales = entry.materialesRecibidos as unknown as Array<
      Record<string, unknown>
    > | null;
    const incidentes = entry.incidentes as unknown as Array<Record<string, unknown>> | null;

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Bitácora #{entry.folio} - ${entry.fecha}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #172033; margin: 40px; }
  h1 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
  h2 { color: #0f766e; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
  .label { font-weight: 600; color: #374151; width: 200px; }
  .firmado { color: #059669; font-weight: 600; }
  .borrador { color: #d97706; font-weight: 600; }
  .section { margin: 20px 0; }
</style>
</head>
<body>
  <h1>Bitácora de Obra</h1>
  <p><strong>Folio:</strong> ${entry.folio} | <strong>Fecha:</strong> ${entry.fecha} | <strong>Turno:</strong> ${entry.turno}</p>
  <p><strong>Estado:</strong> <span class="${entry.estado}">${entry.estado}</span></p>

  ${clima ? `<div class="section"><h2>Clima</h2><p>${JSON.stringify(clima)}</p></div>` : ''}

  ${entry.descripcionGeneral ? `<div class="section"><h2>Descripción General</h2><p>${entry.descripcionGeneral}</p></div>` : ''}

  ${actividades?.length ? `<div class="section"><h2>Actividades Realizadas</h2><table><tr><th>Área</th><th>Descripción</th><th>Avance</th></tr>${actividades.map((a) => `<tr><td>${a.area ?? ''}</td><td>${a.descripcion ?? ''}</td><td>${a.avance_porcentaje ?? ''}%</td></tr>`).join('')}</table></div>` : ''}

  ${personal?.length ? `<div class="section"><h2>Personal</h2><table><tr><th>Oficio</th><th>Cantidad</th><th>Horas</th></tr>${personal.map((p) => `<tr><td>${p.oficio ?? ''}</td><td>${p.cantidad ?? ''}</td><td>${p.horas_trabajadas ?? ''}</td></tr>`).join('')}</table></div>` : ''}

  ${equipos?.length ? `<div class="section"><h2>Equipos</h2><table><tr><th>Equipo</th><th>Cantidad</th><th>Horas</th></tr>${equipos.map((e) => `<tr><td>${e.nombre ?? ''}</td><td>${e.cantidad ?? ''}</td><td>${e.horas_operacion ?? ''}</td></tr>`).join('')}</table></div>` : ''}

  ${materiales?.length ? `<div class="section"><h2>Materiales Recibidos</h2><table><tr><th>Material</th><th>Cantidad</th><th>Proveedor</th></tr>${materiales.map((m) => `<tr><td>${m.nombre ?? ''}</td><td>${m.cantidad ?? ''} ${m.unidad ?? ''}</td><td>${m.proveedor ?? ''}</td></tr>`).join('')}</table></div>` : ''}

  ${incidentes?.length ? `<div class="section"><h2>Incidentes</h2>${incidentes.map((i) => `<p><strong>${i.tipo ?? ''}:</strong> ${i.descripcion ?? ''}${i.impacto ? ` (Impacto: ${i.impacto})` : ''}</p>`).join('')}</div>` : ''}

  ${entry.seguridad ? `<div class="section"><h2>Seguridad</h2><p>${entry.seguridad}</p></div>` : ''}
  ${entry.calidad ? `<div class="section"><h2>Calidad</h2><p>${entry.calidad}</p></div>` : ''}
  ${entry.observaciones ? `<div class="section"><h2>Observaciones</h2><p>${entry.observaciones}</p></div>` : ''}

  ${entry.avanceEstimado ? `<p><strong>Avance estimado:</strong> ${entry.avanceEstimado}%</p>` : ''}

  ${photos.length ? `<div class="section"><h2>Fotos (${photos.length})</h2>${photos.map((p) => `<div style="margin:8px 0"><img src="${p.filePath}" alt="${p.descripcion ?? ''}" style="max-width:400px"/><p>${p.descripcion ?? ''}</p></div>`).join('')}</div>` : ''}

  <div class="section">
    <p><strong>Creado por:</strong> ${entry.createdBy?.name ?? ''} - ${new Date(entry.createdAt).toLocaleString('es-MX')}</p>
    ${entry.firmadoPor ? `<p><strong>Firmado por:</strong> ${entry.firmadoPor.name} - ${entry.firmadoEn ? new Date(entry.firmadoEn).toLocaleString('es-MX') : ''}</p>` : ''}
  </div>
</body></html>`;
  }

  async getFormOptions(user: RequestUser, projectId?: string) {
    const visibleProjectIds = await this.resolveVisibleProjectIds(user.id, projectId);
    const projects = visibleProjectIds.length
      ? await this.projects.find({ where: { id: In(visibleProjectIds) }, order: { name: 'ASC' } })
      : [];

    if (!projectId) {
      return {
        projects: projects.map((p) => ({ id: p.id, name: p.name, code: p.code })),
      };
    }

    return {
      projects: projects.map((p) => ({ id: p.id, name: p.name, code: p.code })),
    };
  }

  private async assertAccess(userId: string, projectId: string) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }

  private async assertEntryAccess(userId: string, entryId: string) {
    const entry = await this.entries.findOne({
      where: { id: entryId },
      relations: ['createdBy', 'firmadoPor', 'project'],
    });
    if (!entry) throw new NotFoundException('Entrada de bitácora no encontrada');
    await this.assertAccess(userId, entry.projectId);
    return entry;
  }

  private async resolveVisibleProjectIds(userId: string, projectId?: string) {
    if (projectId) {
      await this.assertAccess(userId, projectId);
      return [projectId];
    }
    return this.scope.visibleProjectIdsForUser(userId);
  }

  private async createPhotos(entryId: string, userId: string, files: PhotoInputDto[]) {
    for (const file of files) {
      const cleanBase64 = file.base64Content.includes(',')
        ? file.base64Content.split(',')[1]
        : file.base64Content;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const stored = await this.storage.put(buffer, file.fileName, file.mimeType);
      await this.photos.save(
        this.photos.create({
          entryId,
          filePath: stored.fileKey,
          descripcion: file.descripcion,
          tipo: file.tipo ?? 'general',
        })
      );
    }
  }

  private async logHistory(
    entryId: string,
    actorId: string | undefined,
    accion: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ) {
    await this.history.save(
      this.history.create({ entryId, actorId, accion, beforeState, afterState })
    );
  }

  private snapshot(entry: BitacoraEntry) {
    return {
      fecha: entry.fecha,
      turno: entry.turno,
      estado: entry.estado,
      descripcionGeneral: entry.descripcionGeneral,
      avanceEstimado: entry.avanceEstimado,
      firmadoPorId: entry.firmadoPorId,
    };
  }

  private serializeListItem(entry: BitacoraEntry) {
    return {
      id: entry.id,
      bitacoraId: entry.bitacoraId,
      projectId: entry.projectId,
      folio: entry.folio,
      fecha: entry.fecha,
      turno: entry.turno,
      estado: entry.estado,
      descripcionGeneral: entry.descripcionGeneral,
      avanceEstimado: entry.avanceEstimado ? Number(entry.avanceEstimado) : null,
      createdBy: entry.createdBy ? { id: entry.createdBy.id, name: entry.createdBy.name } : null,
      firmadoPor: entry.firmadoPor
        ? { id: entry.firmadoPor.id, name: entry.firmadoPor.name }
        : null,
      firmadoEn: entry.firmadoEn,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private async serializeDetail(entry: BitacoraEntry) {
    const photos = await this.photos.find({ where: { entryId: entry.id } });
    const history = await this.history.find({
      where: { entryId: entry.id },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });

    return {
      ...this.serializeListItem(entry),
      clima: entry.clima,
      descripcionGeneral: entry.descripcionGeneral,
      actividades: entry.actividades,
      personal: entry.personal,
      equipos: entry.equipos,
      materialesRecibidos: entry.materialesRecibidos,
      incidentes: entry.incidentes,
      seguridad: entry.seguridad,
      calidad: entry.calidad,
      observaciones: entry.observaciones,
      avanceEstimado: entry.avanceEstimado ? Number(entry.avanceEstimado) : null,
      fotos: photos.map((p) => ({
        id: p.id,
        filePath: p.filePath,
        descripcion: p.descripcion,
        tipo: p.tipo,
        createdAt: p.createdAt,
      })),
      history: history.map((h) => ({
        id: h.id,
        accion: h.accion,
        beforeState: h.beforeState,
        afterState: h.afterState,
        createdAt: h.createdAt,
        actor: h.actor ? { id: h.actor.id, name: h.actor.name } : null,
      })),
    };
  }
}
