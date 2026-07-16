import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { DocumentRecord } from '../documents/document.entity';
import { Discipline } from '../folders/discipline.entity';
import { Folder } from '../folders/folder.entity';
import { User } from '../users/user.entity';
import { AssignProjectUserDto } from './dto/assign-project-user.dto';
import { CheckCatalogSynonymsDto } from './dto/check-catalog-synonyms.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { SearchCatalogSynonymsDto } from './dto/search-catalog-synonyms.dto';
import { CreateProjectCatalogOptionDto } from './dto/create-project-catalog-option.dto';
import { ProjectDocumentsQueryDto } from './dto/project-documents-query.dto';
import { UpdateProjectCatalogOptionDto } from './dto/update-project-catalog-option.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectCatalogOption, type ProjectCatalogCategory } from './project-catalog-option.entity';
import { ProjectMember } from './project-member.entity';
import { Project } from './project.entity';

type FolderNode = Folder & { children: FolderNode[] };

const ROOT_FOLDER_DEFINITIONS = [
  { key: 'admin', name: '01_Administrativo' },
  { key: 'technical', name: '02_Tecnico' },
  { key: 'construction', name: '03_Obra' },
  { key: 'closing', name: '04_Cierre' },
] as const;

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly members: Repository<ProjectMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Discipline) private readonly disciplines: Repository<Discipline>,
    @InjectRepository(Folder) private readonly folders: Repository<Folder>,
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(ProjectCatalogOption)
    private readonly catalogOptions: Repository<ProjectCatalogOption>,
    private readonly scope: AccessScopeService,
    private readonly audit: AuditService,
    private readonly config: ConfigService
  ) {}

  async getFormOptions(userId: string) {
    const [usersResult, disciplinesResult, catalogOptionsResult] = await Promise.allSettled([
      this.users.find({ where: { active: true }, order: { name: 'ASC' } }),
      this.disciplines.find({ order: { code: 'ASC', name: 'ASC' } }),
      this.listCatalogOptions(),
    ]);

    if (usersResult.status !== 'fulfilled') {
      throw usersResult.reason;
    }

    if (disciplinesResult.status !== 'fulfilled') {
      this.logger.warn(
        `No fue posible cargar disciplinas para form-options del usuario ${userId}: ${
          disciplinesResult.reason instanceof Error
            ? disciplinesResult.reason.message
            : String(disciplinesResult.reason)
        }`
      );
    }

    if (catalogOptionsResult.status !== 'fulfilled') {
      this.logger.warn(
        `No fue posible cargar catalogos para form-options del usuario ${userId}: ${
          catalogOptionsResult.reason instanceof Error
            ? catalogOptionsResult.reason.message
            : String(catalogOptionsResult.reason)
        }`
      );
    }

    const users = usersResult.value;
    const disciplines = disciplinesResult.status === 'fulfilled' ? disciplinesResult.value : [];
    const catalogOptions =
      catalogOptionsResult.status === 'fulfilled' ? catalogOptionsResult.value : [];

    return {
      users: users.map((user) => ({ id: user.id, name: user.name, email: user.email })),
      disciplines: disciplines.map((discipline) => ({
        id: discipline.id,
        code: discipline.code,
        name: discipline.name,
        description: discipline.description,
      })),
      catalogs: this.groupCatalogOptions(catalogOptions),
    };
  }

  async listCatalogOptions() {
    return this.catalogOptions.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC', label: 'ASC' },
    });
  }

  async createCatalogOption(userId: string, dto: CreateProjectCatalogOptionDto) {
    const created = await this.catalogOptions.save(
      this.catalogOptions.create({
        ...dto,
        value: dto.value.trim(),
        label: dto.label.trim(),
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      })
    );
    await this.audit.record({
      actorId: userId,
      action: 'project.catalog_option.create',
      entityType: 'project_catalog_option',
      entityId: created.id,
      metadata: { category: created.category, value: created.value },
    });
    return created;
  }

  async checkSynonyms(dto: CheckCatalogSynonymsDto): Promise<{ synonym: string | null }> {
    const existing = await this.catalogOptions.find({
      where: { category: dto.category, isActive: true },
      select: ['label'],
    });

    if (!existing.length) {
      return { synonym: null };
    }

    const existingLabels = existing.map((opt) => opt.label);
    const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.1';
    const timeoutMs = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS') ?? 120000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const userPrompt = [
      'Categoria: ' + dto.category,
      '',
      'Terminos existentes:',
      ...existingLabels.map((l, i) => `${i + 1}. ${l}`),
      '',
      `Nuevo termino: "${dto.label}"`,
      '',
      'Responde unicamente el numero del termino existente que sea sinonimo o muy similar',
      'al nuevo termino. Si ninguno se parece, responde "0".',
      'No incluyas nada mas en tu respuesta, solo el numero.',
    ].join('\n');

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente que identifica sinonimos o terminos muy similares en espanol ' +
                'para catalogos de proyectos de construccion. ' +
                'Considera sinonimos reales (edificio/edificacion, obra/construccion, planificacion/planeacion), ' +
                'plurales, variaciones ortograficas y conceptos equivalentes. ' +
                'Responde UNICAMENTE con el numero del termino existente mas parecido, o "0" si no hay.',
            },
            { role: 'user', content: userPrompt },
          ],
          options: { temperature: 0.1 },
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Ollama respondio ${response.status} en checkSynonyms`);
        return { synonym: null };
      }

      const payload = (await response.json()) as { message?: { content?: string } };
      const answer = (payload.message?.content ?? '').trim();

      if (!answer || answer === '0') {
        return { synonym: null };
      }

      const matchedIndex = parseInt(answer, 10);
      if (!isNaN(matchedIndex) && matchedIndex >= 1 && matchedIndex <= existingLabels.length) {
        return { synonym: existingLabels[matchedIndex - 1] };
      }

      const matched = existingLabels.find(
        (l) => l.toLowerCase().trim() === answer.toLowerCase().trim()
      );
      if (matched) {
        return { synonym: matched };
      }

      this.logger.warn(`Ollama respondio algo inesperado en checkSynonyms: "${answer}"`);
      return { synonym: null };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(`Ollama timeout en checkSynonyms tras ${timeoutMs}ms`);
      } else {
        this.logger.warn(`Error conectando con Ollama en checkSynonyms: ${error}`);
      }
      return { synonym: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchSynonyms(dto: SearchCatalogSynonymsDto): Promise<{ ids: string[] }> {
    const existing = await this.catalogOptions.find({
      where: { category: dto.category, isActive: true },
      select: ['id', 'label'],
    });

    if (!existing.length || dto.query.trim().length < 2) {
      return { ids: [] };
    }

    const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.1';
    const timeoutMs = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS') ?? 120000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const userPrompt = [
      'Categoria: ' + dto.category,
      '',
      'Terminos disponibles:',
      ...existing.map((opt, i) => `${i + 1}. ${opt.label}`),
      '',
      `Busqueda: "${dto.query}"`,
      '',
      'Responde unicamente los numeros de los terminos que esten relacionados',
      'semanticamente con la busqueda (sinonimos, conceptos similares, equivalentes).',
      'Si ninguno se relaciona responde "0".',
      'Separa los numeros con comas. Ej: "1, 3, 5"',
    ].join('\n');

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente que encuentra terminos semanticamente relacionados ' +
                'en espanol para catalogos de proyectos de construccion. ' +
                'Responde UNICAMENTE con numeros separados por comas, o "0" si no hay coincidencias.',
            },
            { role: 'user', content: userPrompt },
          ],
          options: { temperature: 0.1 },
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Ollama respondio ${response.status} en searchSynonyms`);
        return { ids: [] };
      }

      const payload = (await response.json()) as { message?: { content?: string } };
      const answer = (payload.message?.content ?? '').trim();

      if (!answer || answer === '0') {
        return { ids: [] };
      }

      const indices = answer
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= existing.length);

      const ids = [...new Set(indices.map((i) => existing[i - 1].id))];
      return { ids };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(`Ollama timeout en searchSynonyms tras ${timeoutMs}ms`);
      } else {
        this.logger.warn(`Error conectando con Ollama en searchSynonyms: ${error}`);
      }
      return { ids: [] };
    } finally {
      clearTimeout(timeout);
    }
  }

  async updateCatalogOption(userId: string, id: string, dto: UpdateProjectCatalogOptionDto) {
    const option = await this.catalogOptions.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException('Opción de catálogo no encontrada');
    }

    Object.assign(option, {
      ...dto,
      value: dto.value?.trim() ?? option.value,
      label: dto.label?.trim() ?? option.label,
    });

    const saved = await this.catalogOptions.save(option);
    await this.audit.record({
      actorId: userId,
      action: 'project.catalog_option.update',
      entityType: 'project_catalog_option',
      entityId: id,
      metadata: { ...dto },
    });
    return saved;
  }

  async deactivateCatalogOption(userId: string, id: string) {
    const option = await this.catalogOptions.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException('Opción de catálogo no encontrada');
    }

    option.isActive = false;
    await this.catalogOptions.save(option);
    await this.catalogOptions.softDelete(id);
    await this.audit.record({
      actorId: userId,
      action: 'project.catalog_option.deactivate',
      entityType: 'project_catalog_option',
      entityId: id,
    });
    return { ok: true, id };
  }

  async listForUser(userId: string) {
    const projectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!projectIds.length) {
      return [];
    }

    const [projects, members, documents, disciplineCatalog] = await Promise.all([
      this.projects.find({
        where: { id: In(projectIds), isDraft: false },
        relations: ['responsibleUser'],
        order: { updatedAt: 'DESC' },
      }),
      this.members.find({
        where: { projectId: In(projectIds) },
        relations: ['user'],
      }),
      this.documents.find({
        where: { projectId: In(projectIds) },
        relations: ['responsibleUser'],
      }),
      this.disciplines.find(),
    ]);

    const membersByProject = new Map<string, ProjectMember[]>();
    const documentsByProject = new Map<string, DocumentRecord[]>();
    const disciplineMap = new Map(
      disciplineCatalog.map((discipline) => [discipline.id, discipline])
    );

    for (const member of members) {
      const bucket = membersByProject.get(member.projectId) ?? [];
      bucket.push(member);
      membersByProject.set(member.projectId, bucket);
    }

    for (const document of documents) {
      const bucket = documentsByProject.get(document.projectId) ?? [];
      bucket.push(document);
      documentsByProject.set(document.projectId, bucket);
    }

    return projects.map((project) =>
      this.toProjectSummary(
        project,
        membersByProject.get(project.id) ?? [],
        documentsByProject.get(project.id) ?? [],
        disciplineMap
      )
    );
  }

  async getDetail(userId: string, projectId: string) {
    await this.assertAccess(userId, projectId);

    const project = await this.projects.findOne({
      where: { id: projectId },
      relations: ['responsibleUser'],
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const [members, folderList, disciplineCatalog] = await Promise.all([
      this.members.find({ where: { projectId }, relations: ['user'], order: { createdAt: 'ASC' } }),
      this.folders.find({
        where: { projectId },
        relations: ['discipline'],
        order: { path: 'ASC', name: 'ASC' },
      }),
      this.disciplines.find(),
    ]);

    const projectDisciplineIds = new Set(project.disciplineIds ?? []);
    const projectDisciplineCatalog = disciplineCatalog.filter((d) =>
      projectDisciplineIds.has(d.id)
    );
    const filteredFolderList = folderList.filter(
      (f) => !f.disciplineId || projectDisciplineIds.has(f.disciplineId)
    );

    const disciplineMap = new Map(
      disciplineCatalog.map((discipline) => [discipline.id, discipline])
    );
    const documents = await this.queryProjectDocuments(projectId, {});

    return {
      project: this.toProjectSummary(project, members, documents, disciplineMap),
      folders: this.buildFolderTree(filteredFolderList),
      recentDocuments: this.getRecentDocuments(documents),
      criticalDocuments: this.getCriticalDocuments(documents),
      documentsSummary: this.buildDocumentsSummary(documents),
      availableDisciplines: projectDisciplineCatalog,
    };
  }

  async getProjectDocuments(userId: string, projectId: string, filters: ProjectDocumentsQueryDto) {
    await this.assertAccess(userId, projectId);
    const documents = await this.queryProjectDocuments(projectId, filters);
    return {
      items: documents,
      summary: this.buildDocumentsSummary(documents),
      recent: this.getRecentDocuments(documents),
      critical: this.getCriticalDocuments(documents),
    };
  }

  async create(dto: CreateProjectDto, ownerId: string) {
    const isDraft = dto.isDraft === 'true' || dto.isDraft === true;

    const project = await this.projects.save(
      this.projects.create({
        ...dto,
        ownerId,
        responsibleUserId: dto.responsibleUserId ?? ownerId,
        priority: dto.priority ?? 'media',
        status: isDraft ? 'borrador' : (dto.status ?? 'planificacion'),
        isActive: true,
        isDraft,
        disciplineIds: dto.disciplineIds ?? [],
      })
    );

    await this.members.save(
      this.members.create({
        projectId: project.id,
        userId: ownerId,
        role: 'owner',
        canManageDocuments: true,
        canManageContracts: true,
      })
    );

    if (!isDraft) {
      await this.syncAssignedUsers(project.id, ownerId, dto.assignedUserIds ?? []);
      await this.ensureProjectFolderStructure(project.id, ownerId, dto.disciplineIds ?? []);
      await this.audit.record({
        actorId: ownerId,
        action: 'project.create',
        entityType: 'project',
        entityId: project.id,
        metadata: { name: project.name, code: project.code },
      });
    }

    return this.getDetail(ownerId, project.id);
  }

  async listDrafts(userId: string) {
    return this.projects.find({
      where: { ownerId: userId, isDraft: true },
      relations: ['responsibleUser'],
      order: { updatedAt: 'DESC' },
    });
  }

  async publishDraft(requesterId: string, projectId: string) {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (!project.isDraft) {
      throw new BadRequestException('El proyecto no es un borrador');
    }

    project.isDraft = false;
    project.status = project.status === 'borrador' ? 'planificacion' : project.status;
    await this.projects.save(project);

    await this.ensureProjectFolderStructure(projectId, requesterId, project.disciplineIds ?? []);
    await this.audit.record({
      actorId: requesterId,
      action: 'project.create',
      entityType: 'project',
      entityId: projectId,
      metadata: { name: project.name, code: project.code },
    });

    return this.getDetail(requesterId, projectId);
  }

  async update(requesterId: string, projectId: string, dto: UpdateProjectDto) {
    await this.assertAccess(requesterId, projectId);
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const before = {
      name: project.name,
      code: project.code,
      priority: project.priority,
      status: project.status,
      responsibleUserId: project.responsibleUserId,
    };
    Object.assign(project, {
      ...dto,
      disciplineIds: dto.disciplineIds ?? project.disciplineIds,
      responsibleUserId: dto.responsibleUserId ?? project.responsibleUserId,
    });

    await this.projects.save(project);

    if (dto.assignedUserIds) {
      await this.syncAssignedUsers(projectId, project.ownerId ?? requesterId, dto.assignedUserIds);
    }

    if (dto.disciplineIds) {
      await this.ensureProjectFolderStructure(projectId, requesterId, dto.disciplineIds);
    }

    await this.audit.record({
      actorId: requesterId,
      action: 'project.update',
      entityType: 'project',
      entityId: projectId,
      metadata: { before, after: dto },
    });

    return this.getDetail(requesterId, projectId);
  }

  async deactivate(requesterId: string, projectId: string) {
    await this.assertAccess(requesterId, projectId);
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    project.isActive = false;
    await this.projects.save(project);
    await this.audit.record({
      actorId: requesterId,
      action: 'project.deactivate',
      entityType: 'project',
      entityId: projectId,
    });
    return { ok: true, projectId, isActive: false };
  }

  async assignUser(requesterId: string, projectId: string, dto: AssignProjectUserDto) {
    await this.assertAccess(requesterId, projectId);
    const current = await this.members.findOne({ where: { projectId, userId: dto.userId } });
    const membership = current ?? this.members.create({ projectId, userId: dto.userId });
    membership.role = dto.role;
    membership.canManageDocuments =
      dto.canManageDocuments ?? membership.canManageDocuments ?? false;
    membership.canManageContracts =
      dto.canManageContracts ?? membership.canManageContracts ?? false;
    const saved = await this.members.save(membership);
    await this.audit.record({
      actorId: requesterId,
      action: 'project.assign_user',
      entityType: 'project',
      entityId: projectId,
      metadata: { userId: dto.userId, role: dto.role },
    });
    return saved;
  }

  async listMembers(userId: string, projectId: string) {
    await this.assertAccess(userId, projectId);
    return this.members.find({ where: { projectId }, relations: ['user'] });
  }

  async assertAccess(userId: string, projectId: string) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }

  private async syncAssignedUsers(projectId: string, ownerId: string, assignedUserIds: string[]) {
    const uniqueUserIds = [...new Set([ownerId, ...assignedUserIds])];
    const existing = await this.members.find({ where: { projectId } });
    const existingByUser = new Map(existing.map((member) => [member.userId, member]));

    for (const userId of uniqueUserIds) {
      if (userId === ownerId) {
        continue;
      }

      if (!existingByUser.has(userId)) {
        await this.members.save(
          this.members.create({
            projectId,
            userId,
            role: 'viewer',
            canManageDocuments: false,
            canManageContracts: false,
          })
        );
      }
    }
  }

  private async ensureProjectFolderStructure(
    projectId: string,
    userId: string,
    disciplineIds: string[]
  ) {
    const existingFolders = await this.folders.find({ where: { projectId } });
    const rootsByName = new Map(
      existingFolders.filter((folder) => !folder.parentId).map((folder) => [folder.name, folder])
    );

    for (const definition of ROOT_FOLDER_DEFINITIONS) {
      if (!rootsByName.has(definition.name)) {
        const root = await this.folders.save(
          this.folders.create({
            projectId,
            name: definition.name,
            path: definition.name,
            createdById: userId,
          })
        );
        rootsByName.set(definition.name, root);
      }
    }

    const technicalRoot = rootsByName.get('02_Tecnico');
    if (!technicalRoot || !disciplineIds.length) {
      return;
    }

    const disciplines = await this.disciplines.find({ where: { id: In(disciplineIds) } });
    const disciplineFolders = new Map(
      existingFolders
        .filter((folder) => folder.parentId === technicalRoot.id && folder.disciplineId)
        .map((folder) => [folder.disciplineId as string, folder])
    );

    for (const discipline of disciplines) {
      if (!disciplineFolders.has(discipline.id)) {
        await this.folders.save(
          this.folders.create({
            projectId,
            parentId: technicalRoot.id,
            disciplineId: discipline.id,
            name: `${discipline.code}_${discipline.name}`,
            path: `${technicalRoot.path}/${discipline.code}_${discipline.name}`,
            createdById: userId,
          })
        );
      }
    }
  }

  private async queryProjectDocuments(projectId: string, filters: ProjectDocumentsQueryDto) {
    const query = this.documents
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.folder', 'folder')
      .leftJoinAndSelect('document.discipline', 'discipline')
      .leftJoinAndSelect('document.responsibleUser', 'responsibleUser')
      .where('document.projectId = :projectId', { projectId })
      .orderBy('document.updatedAt', 'DESC');

    if (filters.disciplineId) {
      query.andWhere('document.disciplineId = :disciplineId', {
        disciplineId: filters.disciplineId,
      });
    }

    if (filters.folderId) {
      query.andWhere('document.folderId = :folderId', { folderId: filters.folderId });
    }

    if (filters.status) {
      query.andWhere('document.status = :status', { status: filters.status });
    }

    if (filters.responsibleId) {
      query.andWhere('document.responsibleUserId = :responsibleId', {
        responsibleId: filters.responsibleId,
      });
    }

    if (filters.dateFrom) {
      query.andWhere('document.dueDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('document.dueDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.search) {
      query.andWhere(
        '(document.name LIKE :search OR document.documentNumber LIKE :search OR discipline.name LIKE :search OR folder.name LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query.getMany();
  }

  private toProjectSummary(
    project: Project,
    members: ProjectMember[],
    documents: DocumentRecord[],
    disciplineMap: Map<string, Discipline>
  ) {
    const assignedUsers = members
      .filter((member) => member.user)
      .map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      }));

    const overdueCount = documents.filter((document) => this.isCriticalDocument(document)).length;
    const approvedCount = documents.filter((document) => document.status === 'approved').length;
    const disciplines = (project.disciplineIds ?? [])
      .map((disciplineId) => disciplineMap.get(disciplineId))
      .filter(Boolean)
      .map((discipline) => ({
        id: discipline!.id,
        code: discipline!.code,
        name: discipline!.name,
      }));

    return {
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      workType: project.workType,
      currentStage: project.currentStage,
      priority: project.priority,
      targetDate: project.targetDate,
      status: project.status,
      isActive: project.isActive,
      responsible: project.responsibleUser
        ? {
            id: project.responsibleUser.id,
            name: project.responsibleUser.name,
            email: project.responsibleUser.email,
          }
        : null,
      assignedUsers,
      disciplines,
      metrics: {
        documents: documents.length,
        approved: approvedCount,
        critical: overdueCount,
        progress: documents.length ? Math.round((approvedCount / documents.length) * 100) : 0,
      },
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
    };
  }

  private buildFolderTree(folders: Folder[]): FolderNode[] {
    const nodes = new Map<string, FolderNode>();

    for (const folder of folders) {
      nodes.set(folder.id, { ...folder, children: [] });
    }

    const roots: FolderNode[] = [];
    for (const folder of folders) {
      const node = nodes.get(folder.id)!;
      if (folder.parentId && nodes.has(folder.parentId)) {
        nodes.get(folder.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private getRecentDocuments(documents: DocumentRecord[]) {
    return [...documents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }

  private getCriticalDocuments(documents: DocumentRecord[]) {
    return documents.filter((document) => this.isCriticalDocument(document)).slice(0, 8);
  }

  private buildDocumentsSummary(documents: DocumentRecord[]) {
    return {
      total: documents.length,
      approved: documents.filter((document) => document.status === 'approved').length,
      inReview: documents.filter((document) => document.status === 'in_review').length,
      overdue: documents.filter((document) => this.isOverdue(document)).length,
      critical: documents.filter((document) => this.isCriticalDocument(document)).length,
    };
  }

  private isCriticalDocument(document: DocumentRecord) {
    return this.isOverdue(document) || this.isDueSoon(document);
  }

  private isOverdue(document: DocumentRecord) {
    if (!document.dueDate || document.status === 'approved' || document.status === 'archived') {
      return false;
    }

    const today = new Date();
    const due = new Date(`${document.dueDate}T00:00:00`);
    return due.getTime() < new Date(today.toDateString()).getTime();
  }

  private isDueSoon(document: DocumentRecord) {
    if (!document.dueDate || document.status === 'approved' || document.status === 'archived') {
      return false;
    }

    const today = new Date();
    const due = new Date(`${document.dueDate}T00:00:00`);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }

  private groupCatalogOptions(options: ProjectCatalogOption[]) {
    const categories: Record<ProjectCatalogCategory, ProjectCatalogOption[]> = {
      workType: [],
      currentStage: [],
      priority: [],
    };

    for (const option of options) {
      categories[option.category].push(option);
    }

    return categories;
  }
}
