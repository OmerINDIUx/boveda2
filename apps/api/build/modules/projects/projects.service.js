'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProjectsService = void 0;
const common_1 = require('@nestjs/common');
const typeorm_1 = require('@nestjs/typeorm');
const typeorm_2 = require('typeorm');
const access_scope_service_1 = require('../../common/access-scope.service');
const audit_service_1 = require('../audit/audit.service');
const document_entity_1 = require('../documents/document.entity');
const discipline_entity_1 = require('../folders/discipline.entity');
const folder_entity_1 = require('../folders/folder.entity');
const user_entity_1 = require('../users/user.entity');
const project_member_entity_1 = require('./project-member.entity');
const project_entity_1 = require('./project.entity');
const ROOT_FOLDER_DEFINITIONS = [
  { key: 'admin', name: '01_Administrativo' },
  { key: 'technical', name: '02_Tecnico' },
  { key: 'construction', name: '03_Obra' },
  { key: 'closing', name: '04_Cierre' },
];
let ProjectsService = class ProjectsService {
  projects;
  members;
  users;
  disciplines;
  folders;
  documents;
  scope;
  audit;
  constructor(projects, members, users, disciplines, folders, documents, scope, audit) {
    this.projects = projects;
    this.members = members;
    this.users = users;
    this.disciplines = disciplines;
    this.folders = folders;
    this.documents = documents;
    this.scope = scope;
    this.audit = audit;
  }
  async listForUser(userId) {
    const projectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!projectIds.length) {
      return [];
    }
    const [projects, members, documents, disciplineCatalog] = await Promise.all([
      this.projects.find({
        where: { id: (0, typeorm_2.In)(projectIds) },
        relations: ['responsibleUser'],
        order: { updatedAt: 'DESC' },
      }),
      this.members.find({
        where: { projectId: (0, typeorm_2.In)(projectIds) },
        relations: ['user'],
      }),
      this.documents.find({
        where: { projectId: (0, typeorm_2.In)(projectIds) },
        relations: ['responsibleUser'],
      }),
      this.disciplines.find(),
    ]);
    const membersByProject = new Map();
    const documentsByProject = new Map();
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
  async getDetail(userId, projectId) {
    await this.assertAccess(userId, projectId);
    const project = await this.projects.findOne({
      where: { id: projectId },
      relations: ['responsibleUser'],
    });
    if (!project) {
      throw new common_1.NotFoundException('Proyecto no encontrado');
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
    const disciplineMap = new Map(
      disciplineCatalog.map((discipline) => [discipline.id, discipline])
    );
    const documents = await this.queryProjectDocuments(projectId, {});
    return {
      project: this.toProjectSummary(project, members, documents, disciplineMap),
      folders: this.buildFolderTree(folderList),
      recentDocuments: this.getRecentDocuments(documents),
      criticalDocuments: this.getCriticalDocuments(documents),
      documentsSummary: this.buildDocumentsSummary(documents),
      availableDisciplines: disciplineCatalog,
    };
  }
  async getProjectDocuments(userId, projectId, filters) {
    await this.assertAccess(userId, projectId);
    const documents = await this.queryProjectDocuments(projectId, filters);
    return {
      items: documents,
      summary: this.buildDocumentsSummary(documents),
      recent: this.getRecentDocuments(documents),
      critical: this.getCriticalDocuments(documents),
    };
  }
  async create(dto, ownerId) {
    const project = await this.projects.save(
      this.projects.create({
        ...dto,
        ownerId,
        responsibleUserId: dto.responsibleUserId ?? ownerId,
        priority: dto.priority ?? 'media',
        status: dto.status ?? 'planificacion',
        isActive: true,
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
    await this.syncAssignedUsers(project.id, ownerId, dto.assignedUserIds ?? []);
    await this.ensureProjectFolderStructure(project.id, ownerId, dto.disciplineIds ?? []);
    await this.audit.record({
      actorId: ownerId,
      action: 'project.create',
      entityType: 'project',
      entityId: project.id,
      metadata: { name: project.name, code: project.code },
    });
    return this.getDetail(ownerId, project.id);
  }
  async update(requesterId, projectId, dto) {
    await this.assertAccess(requesterId, projectId);
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) {
      throw new common_1.NotFoundException('Proyecto no encontrado');
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
  async deactivate(requesterId, projectId) {
    await this.assertAccess(requesterId, projectId);
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) {
      throw new common_1.NotFoundException('Proyecto no encontrado');
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
  async assignUser(requesterId, projectId, dto) {
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
  async listMembers(userId, projectId) {
    await this.assertAccess(userId, projectId);
    return this.members.find({ where: { projectId }, relations: ['user'] });
  }
  async assertAccess(userId, projectId) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
    }
  }
  async syncAssignedUsers(projectId, ownerId, assignedUserIds) {
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
  async ensureProjectFolderStructure(projectId, userId, disciplineIds) {
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
    const disciplines = await this.disciplines.find({
      where: { id: (0, typeorm_2.In)(disciplineIds) },
    });
    const disciplineFolders = new Map(
      existingFolders
        .filter((folder) => folder.parentId === technicalRoot.id && folder.disciplineId)
        .map((folder) => [folder.disciplineId, folder])
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
  async queryProjectDocuments(projectId, filters) {
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
  toProjectSummary(project, members, documents, disciplineMap) {
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
        id: discipline.id,
        code: discipline.code,
        name: discipline.name,
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
  buildFolderTree(folders) {
    const nodes = new Map();
    for (const folder of folders) {
      nodes.set(folder.id, { ...folder, children: [] });
    }
    const roots = [];
    for (const folder of folders) {
      const node = nodes.get(folder.id);
      if (folder.parentId && nodes.has(folder.parentId)) {
        nodes.get(folder.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
  getRecentDocuments(documents) {
    return [...documents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }
  getCriticalDocuments(documents) {
    return documents.filter((document) => this.isCriticalDocument(document)).slice(0, 8);
  }
  buildDocumentsSummary(documents) {
    return {
      total: documents.length,
      approved: documents.filter((document) => document.status === 'approved').length,
      inReview: documents.filter((document) => document.status === 'in_review').length,
      overdue: documents.filter((document) => this.isOverdue(document)).length,
      critical: documents.filter((document) => this.isCriticalDocument(document)).length,
    };
  }
  isCriticalDocument(document) {
    return this.isOverdue(document) || this.isDueSoon(document);
  }
  isOverdue(document) {
    if (!document.dueDate || document.status === 'approved' || document.status === 'archived') {
      return false;
    }
    const today = new Date();
    const due = new Date(`${document.dueDate}T00:00:00`);
    return due.getTime() < new Date(today.toDateString()).getTime();
  }
  isDueSoon(document) {
    if (!document.dueDate || document.status === 'approved' || document.status === 'archived') {
      return false;
    }
    const today = new Date();
    const due = new Date(`${document.dueDate}T00:00:00`);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(project_member_entity_1.ProjectMember)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(discipline_entity_1.Discipline)),
    __param(4, (0, typeorm_1.InjectRepository)(folder_entity_1.Folder)),
    __param(5, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __metadata('design:paramtypes', [
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      access_scope_service_1.AccessScopeService,
      audit_service_1.AuditService,
    ]),
  ],
  ProjectsService
);
//# sourceMappingURL=projects.service.js.map
