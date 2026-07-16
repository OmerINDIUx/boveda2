"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const projects_module_1 = require("./modules/projects/projects.module");
const folders_module_1 = require("./modules/folders/folders.module");
const documents_module_1 = require("./modules/documents/documents.module");
const versions_module_1 = require("./modules/versions/versions.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const rfis_module_1 = require("./modules/rfis/rfis.module");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const ai_query_module_1 = require("./modules/ai-query/ai-query.module");
const clm_module_1 = require("./modules/clm/clm.module");
const storage_module_1 = require("./storage/storage.module");
const nomenclatures_module_1 = require("./modules/nomenclatures/nomenclatures.module");
const project_emails_module_1 = require("./modules/project-emails/project-emails.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const response_times_module_1 = require("./modules/response-times/response-times.module");
const bitacoras_module_1 = require("./modules/bitacoras/bitacoras.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.MYSQL_HOST ?? '127.0.0.1',
                port: Number(process.env.MYSQL_PORT ?? 3306),
                database: process.env.MYSQL_DATABASE ?? 'holocron',
                username: process.env.MYSQL_USER ?? 'root',
                password: process.env.MYSQL_PASSWORD ?? '',
                autoLoadEntities: true,
                synchronize: false,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'default',
                    ttl: Number(process.env.THROTTLE_TTL ?? 60000),
                    limit: Number(process.env.THROTTLE_LIMIT ?? 60),
                },
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            projects_module_1.ProjectsModule,
            folders_module_1.FoldersModule,
            documents_module_1.DocumentsModule,
            versions_module_1.VersionsModule,
            audit_module_1.AuditModule,
            dashboard_module_1.DashboardModule,
            rfis_module_1.RfisModule,
            approvals_module_1.ApprovalsModule,
            notifications_module_1.NotificationsModule,
            ai_query_module_1.AiQueryModule,
            clm_module_1.ClmModule,
            storage_module_1.StorageModule,
            nomenclatures_module_1.NomenclaturesModule,
            project_emails_module_1.ProjectEmailsModule,
            uploads_module_1.UploadsModule,
            response_times_module_1.ResponseTimesModule,
            bitacoras_module_1.BitacorasModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map