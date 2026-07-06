"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const audit_module_1 = require("../audit/audit.module");
const document_entity_1 = require("../documents/document.entity");
const discipline_entity_1 = require("../folders/discipline.entity");
const folder_entity_1 = require("../folders/folder.entity");
const user_entity_1 = require("../users/user.entity");
const project_member_entity_1 = require("./project-member.entity");
const project_entity_1 = require("./project.entity");
const projects_controller_1 = require("./projects.controller");
const projects_service_1 = require("./projects.service");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project, project_member_entity_1.ProjectMember, user_entity_1.User, discipline_entity_1.Discipline, folder_entity_1.Folder, document_entity_1.DocumentRecord])],
        controllers: [projects_controller_1.ProjectsController],
        providers: [projects_service_1.ProjectsService, access_scope_service_1.AccessScopeService],
        exports: [projects_service_1.ProjectsService, access_scope_service_1.AccessScopeService, typeorm_1.TypeOrmModule]
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map