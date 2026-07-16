"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DocumentConverterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentConverterService = void 0;
const common_1 = require("@nestjs/common");
const mammoth = require("mammoth");
let DocumentConverterService = DocumentConverterService_1 = class DocumentConverterService {
    logger = new common_1.Logger(DocumentConverterService_1.name);
    async docxToHtml(buffer) {
        const result = await mammoth.convertToHtml({ buffer });
        return { html: result.value, warnings: result.messages.map((m) => m.message) };
    }
    async docxToText(buffer) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
};
exports.DocumentConverterService = DocumentConverterService;
exports.DocumentConverterService = DocumentConverterService = DocumentConverterService_1 = __decorate([
    (0, common_1.Injectable)()
], DocumentConverterService);
//# sourceMappingURL=document-converter.service.js.map