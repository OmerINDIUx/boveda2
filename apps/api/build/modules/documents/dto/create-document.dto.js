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
Object.defineProperty(exports, '__esModule', { value: true });
exports.CreateDocumentDto = void 0;
const class_validator_1 = require('class-validator');
class CreateDocumentDto {
  projectId;
  name;
  title;
  documentNumber;
  folderId;
  disciplineId;
  responsibleUserId;
  confidentialityLevel;
  renewable;
  dueDate;
  status;
  fileName;
  mimeType;
  base64Content;
  revision;
  notes;
  sizeBytes;
  metadata;
}
exports.CreateDocumentDto = CreateDocumentDto;
__decorate(
  [(0, class_validator_1.IsString)(), __metadata('design:type', String)],
  CreateDocumentDto.prototype,
  'projectId',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'name',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'title',
  void 0
);
__decorate(
  [(0, class_validator_1.IsString)(), __metadata('design:type', String)],
  CreateDocumentDto.prototype,
  'documentNumber',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'folderId',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'disciplineId',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'responsibleUserId',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'confidentialityLevel',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata('design:type', Boolean),
  ],
  CreateDocumentDto.prototype,
  'renewable',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'dueDate',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'status',
  void 0
);
__decorate(
  [(0, class_validator_1.IsString)(), __metadata('design:type', String)],
  CreateDocumentDto.prototype,
  'fileName',
  void 0
);
__decorate(
  [(0, class_validator_1.IsString)(), __metadata('design:type', String)],
  CreateDocumentDto.prototype,
  'mimeType',
  void 0
);
__decorate(
  [(0, class_validator_1.IsString)(), __metadata('design:type', String)],
  CreateDocumentDto.prototype,
  'base64Content',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'revision',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata('design:type', String),
  ],
  CreateDocumentDto.prototype,
  'notes',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata('design:type', Number),
  ],
  CreateDocumentDto.prototype,
  'sizeBytes',
  void 0
);
__decorate(
  [
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata('design:type', Array),
  ],
  CreateDocumentDto.prototype,
  'metadata',
  void 0
);
//# sourceMappingURL=create-document.dto.js.map
