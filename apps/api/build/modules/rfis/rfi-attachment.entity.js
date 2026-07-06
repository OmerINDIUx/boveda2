"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfiAttachment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const rfi_comment_entity_1 = require("./rfi-comment.entity");
const rfi_entity_1 = require("./rfi.entity");
let RfiAttachment = class RfiAttachment {
    id;
    rfiId;
    rfi;
    commentId;
    comment;
    fileKey;
    fileName;
    mimeType;
    sizeBytes;
    uploadedById;
    uploadedBy;
    createdAt;
    deletedAt;
};
exports.RfiAttachment = RfiAttachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RfiAttachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rfi_id' }),
    __metadata("design:type", String)
], RfiAttachment.prototype, "rfiId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rfi_entity_1.Rfi, (rfi) => rfi.attachments),
    (0, typeorm_1.JoinColumn)({ name: 'rfi_id' }),
    __metadata("design:type", rfi_entity_1.Rfi)
], RfiAttachment.prototype, "rfi", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comment_id', nullable: true }),
    __metadata("design:type", String)
], RfiAttachment.prototype, "commentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rfi_comment_entity_1.RfiComment, (comment) => comment.attachments, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'comment_id' }),
    __metadata("design:type", rfi_comment_entity_1.RfiComment)
], RfiAttachment.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_key' }),
    __metadata("design:type", String)
], RfiAttachment.prototype, "fileKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name' }),
    __metadata("design:type", String)
], RfiAttachment.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', length: 120 }),
    __metadata("design:type", String)
], RfiAttachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_bytes', type: 'bigint' }),
    __metadata("design:type", Number)
], RfiAttachment.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_id' }),
    __metadata("design:type", String)
], RfiAttachment.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' }),
    __metadata("design:type", user_entity_1.User)
], RfiAttachment.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RfiAttachment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], RfiAttachment.prototype, "deletedAt", void 0);
exports.RfiAttachment = RfiAttachment = __decorate([
    (0, typeorm_1.Entity)('rfi_attachments')
], RfiAttachment);
//# sourceMappingURL=rfi-attachment.entity.js.map