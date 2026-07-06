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
exports.RfiComment = void 0;
const typeorm_1 = require("typeorm");
const rfi_entity_1 = require("./rfi.entity");
const user_entity_1 = require("../users/user.entity");
const rfi_attachment_entity_1 = require("./rfi-attachment.entity");
let RfiComment = class RfiComment {
    id;
    rfiId;
    rfi;
    userId;
    author;
    body;
    type;
    attachments;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.RfiComment = RfiComment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RfiComment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rfi_id' }),
    __metadata("design:type", String)
], RfiComment.prototype, "rfiId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rfi_entity_1.Rfi, (rfi) => rfi.comments),
    (0, typeorm_1.JoinColumn)({ name: 'rfi_id' }),
    __metadata("design:type", rfi_entity_1.Rfi)
], RfiComment.prototype, "rfi", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], RfiComment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], RfiComment.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comment', type: 'text' }),
    __metadata("design:type", String)
], RfiComment.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comment_type', default: 'comment' }),
    __metadata("design:type", String)
], RfiComment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rfi_attachment_entity_1.RfiAttachment, (attachment) => attachment.comment),
    __metadata("design:type", Array)
], RfiComment.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RfiComment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RfiComment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], RfiComment.prototype, "deletedAt", void 0);
exports.RfiComment = RfiComment = __decorate([
    (0, typeorm_1.Entity)('rfi_comments')
], RfiComment);
//# sourceMappingURL=rfi-comment.entity.js.map