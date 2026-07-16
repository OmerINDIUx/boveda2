"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitacorasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const notifications_module_1 = require("../notifications/notifications.module");
const project_entity_1 = require("../projects/project.entity");
const user_entity_1 = require("../users/user.entity");
const storage_module_1 = require("../../storage/storage.module");
const bitacora_entity_1 = require("./bitacora.entity");
const bitacora_entry_entity_1 = require("./bitacora-entry.entity");
const bitacora_photo_entity_1 = require("./bitacora-photo.entity");
const bitacora_history_entity_1 = require("./bitacora-history.entity");
const bitacoras_controller_1 = require("./bitacoras.controller");
const bitacoras_service_1 = require("./bitacoras.service");
let BitacorasModule = class BitacorasModule {
};
exports.BitacorasModule = BitacorasModule;
exports.BitacorasModule = BitacorasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([bitacora_entity_1.Bitacora, bitacora_entry_entity_1.BitacoraEntry, bitacora_photo_entity_1.BitacoraPhoto, bitacora_history_entity_1.BitacoraHistory, project_entity_1.Project, user_entity_1.User]),
            storage_module_1.StorageModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [bitacoras_controller_1.BitacorasController],
        providers: [bitacoras_service_1.BitacorasService],
    })
], BitacorasModule);
//# sourceMappingURL=bitacoras.module.js.map