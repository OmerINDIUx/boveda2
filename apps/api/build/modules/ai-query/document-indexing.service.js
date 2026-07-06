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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentIndexingService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const child_process_1 = require("child_process");
const typeorm_2 = require("typeorm");
const storage_service_1 = require("../../storage/storage.service");
const document_chunk_entity_1 = require("../documents/document-chunk.entity");
const document_embedding_entity_1 = require("../documents/document-embedding.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
const EMBEDDING_DIMENSIONS = 256;
const EMBEDDING_PROVIDER = 'local';
const EMBEDDING_MODEL = 'holocron-hash-v1';
const MAX_CHUNK_LENGTH = 1200;
const CHUNK_OVERLAP = 180;
let DocumentIndexingService = class DocumentIndexingService {
    versions;
    chunks;
    embeddings;
    storage;
    constructor(versions, chunks, embeddings, storage) {
        this.versions = versions;
        this.chunks = chunks;
        this.embeddings = embeddings;
        this.storage = storage;
    }
    async ensureVersionIndexed(document, version) {
        const buffer = await this.storage.read(version.fileKey);
        const contentHash = (0, crypto_1.createHash)('sha256').update(buffer).digest('hex');
        const alreadyIndexed = version.contentHash === contentHash &&
            version.contentExtractionStatus === 'completed' &&
            (await this.chunks.count({ where: { documentId: document.id, versionId: version.id } })) > 0;
        if (alreadyIndexed) {
            return;
        }
        version.contentExtractionStatus = 'processing';
        version.contentExtractionError = undefined;
        await this.versions.save(version);
        try {
            const extracted = await this.extractText(version.fileName, version.mimeType, buffer);
            const rawChunks = this.buildChunks(document, version, extracted);
            const existingChunks = await this.chunks.find({
                where: { documentId: document.id, versionId: version.id },
                select: { id: true }
            });
            const existingChunkIds = existingChunks.map((chunk) => chunk.id);
            if (existingChunkIds.length) {
                await this.embeddings
                    .createQueryBuilder()
                    .delete()
                    .from(document_embedding_entity_1.DocumentEmbedding)
                    .where('chunk_id IN (:...chunkIds)', { chunkIds: existingChunkIds })
                    .execute();
            }
            await this.chunks.delete({ documentId: document.id, versionId: version.id });
            if (rawChunks.length) {
                const savedChunks = await this.chunks.save(rawChunks.map((item, index) => this.chunks.create({
                    documentId: document.id,
                    versionId: version.id,
                    chunkIndex: index,
                    content: item.content,
                    tokenCount: item.tokenCount,
                    pageNumber: item.pageNumber,
                    sectionLabel: item.sectionLabel
                })));
                await this.embeddings.save(savedChunks.map((chunk) => this.embeddings.create({
                    chunkId: chunk.id,
                    provider: EMBEDDING_PROVIDER,
                    model: EMBEDDING_MODEL,
                    dimensions: EMBEDDING_DIMENSIONS,
                    embedding: this.createEmbedding(chunk.content),
                    contentHash: (0, crypto_1.createHash)('sha256').update(chunk.content).digest('hex')
                })));
            }
            version.contentHash = contentHash;
            version.contentExtractionStatus = 'completed';
            version.contentExtractionError = undefined;
            version.contentExtractedAt = new Date();
            await this.versions.save(version);
        }
        catch (error) {
            version.contentExtractionStatus = 'failed';
            version.contentExtractionError = error instanceof Error ? error.message : 'No fue posible extraer el contenido';
            await this.versions.save(version);
            throw error;
        }
    }
    async searchVisibleChunks(documentIds, question, limit = 8) {
        if (!documentIds.length) {
            return [];
        }
        const rows = await this.embeddings
            .createQueryBuilder('embedding')
            .innerJoinAndSelect('embedding.chunk', 'chunk')
            .where('chunk.documentId IN (:...documentIds)', { documentIds })
            .andWhere('embedding.provider = :provider', { provider: EMBEDDING_PROVIDER })
            .andWhere('embedding.model = :model', { model: EMBEDDING_MODEL })
            .getMany();
        const queryEmbedding = this.createEmbedding(question);
        return rows
            .map((embedding) => ({
            chunk: embedding.chunk,
            embedding: embedding.embedding,
            score: this.cosineSimilarity(queryEmbedding, embedding.embedding) + this.keywordBoost(question, embedding.chunk.content)
        }))
            .filter((item) => item.score > 0.08)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit);
    }
    async extractText(fileName, mimeType, buffer) {
        if (mimeType === 'text/plain') {
            return {
                contentType: 'text',
                segments: [{ text: buffer.toString('utf8') }]
            };
        }
        const pythonCode = `
import io, json, sys
from pypdf import PdfReader
from docx import Document
from openpyxl import load_workbook

file_name = sys.argv[1]
mime_type = sys.argv[2]
payload = sys.stdin.buffer.read()

def clean(text):
    if not text:
        return ""
    return " ".join(str(text).replace("\\x00", " ").split())

def extract_pdf(data):
    reader = PdfReader(io.BytesIO(data))
    segments = []
    for index, page in enumerate(reader.pages, start=1):
        text = clean(page.extract_text() or "")
        if text:
            segments.append({"text": text, "pageNumber": index})
    return {"contentType": "pdf", "segments": segments}

def extract_docx(data):
    document = Document(io.BytesIO(data))
    segments = []
    current_label = None
    for paragraph in document.paragraphs:
        text = clean(paragraph.text)
        if not text:
            continue
        style_name = getattr(paragraph.style, "name", "") or ""
        if "heading" in style_name.lower():
            current_label = text
            continue
        segments.append({"text": text, "sectionLabel": current_label})
    return {"contentType": "docx", "segments": segments}

def extract_xlsx(data):
    workbook = load_workbook(io.BytesIO(data), data_only=True)
    segments = []
    for sheet in workbook.worksheets:
        for row_index, row in enumerate(sheet.iter_rows(values_only=True), start=1):
            values = [clean(value) for value in row if value not in (None, "")]
            text = " | ".join([value for value in values if value])
            if text:
                segments.append({"text": text, "sectionLabel": f"{sheet.title} fila {row_index}"})
    return {"contentType": "xlsx", "segments": segments}

if mime_type == "application/pdf" or file_name.lower().endswith(".pdf"):
    output = extract_pdf(payload)
elif mime_type in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",) or file_name.lower().endswith(".docx"):
    output = extract_docx(payload)
elif mime_type in ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel") or file_name.lower().endswith(".xlsx"):
    output = extract_xlsx(payload)
else:
    output = {"contentType": "text", "segments": [{"text": clean(payload.decode("utf-8", errors="ignore"))}]}

sys.stdout.write(json.dumps(output, ensure_ascii=True))
`;
        const pythonExecutable = process.env.HOLOCRON_PYTHON_PATH ?? process.env.PYTHON_PATH ?? 'python';
        const result = await this.runPython(pythonExecutable, pythonCode, [fileName, mimeType], buffer);
        try {
            const parsed = JSON.parse(result);
            return {
                contentType: parsed.contentType,
                segments: (parsed.segments ?? []).filter((segment) => segment.text?.trim().length)
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`No se pudo interpretar la extraccion documental para ${fileName}: ${error instanceof Error ? error.message : 'error'}`);
        }
    }
    async runPython(executable, code, args, stdin) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(executable, ['-c', code, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
            const stdout = [];
            const stderr = [];
            child.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
            child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
            child.on('error', (error) => reject(new common_1.InternalServerErrorException(`No fue posible iniciar Python: ${error.message}`)));
            child.on('close', (codeValue) => {
                if (codeValue !== 0) {
                    reject(new common_1.InternalServerErrorException(`La extraccion documental fallo: ${Buffer.concat(stderr).toString('utf8') || `codigo ${codeValue}`}`));
                    return;
                }
                resolve(Buffer.concat(stdout).toString('utf8'));
            });
            child.stdin.write(stdin);
            child.stdin.end();
        });
    }
    buildChunks(document, version, extracted) {
        const segments = [];
        const header = [
            `Documento: ${document.name}`,
            `Numero: ${document.documentNumber}`,
            `Version: ${version.revision}`,
            `Estado: ${document.status}`,
            document.dueDate ? `Vence: ${document.dueDate}` : undefined,
            document.confidentialityLevel ? `Confidencialidad: ${document.confidentialityLevel}` : undefined,
            version.notes ? `Notas de version: ${version.notes}` : undefined
        ]
            .filter(Boolean)
            .join('. ');
        segments.push({
            content: header,
            tokenCount: this.estimateTokenCount(header),
            sectionLabel: 'Resumen documental'
        });
        for (const segment of extracted.segments) {
            const normalized = this.normalizeWhitespace(segment.text);
            if (!normalized) {
                continue;
            }
            for (const piece of this.splitLongText(normalized)) {
                segments.push({
                    content: piece,
                    tokenCount: this.estimateTokenCount(piece),
                    pageNumber: segment.pageNumber,
                    sectionLabel: segment.sectionLabel
                });
            }
        }
        return segments;
    }
    splitLongText(text) {
        if (text.length <= MAX_CHUNK_LENGTH) {
            return [text];
        }
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            let end = Math.min(start + MAX_CHUNK_LENGTH, text.length);
            if (end < text.length) {
                const breakAt = Math.max(text.lastIndexOf('. ', end), text.lastIndexOf(' ', end));
                if (breakAt > start + 300) {
                    end = breakAt + 1;
                }
            }
            const slice = text.slice(start, end).trim();
            if (slice) {
                chunks.push(slice);
            }
            start = Math.max(end - CHUNK_OVERLAP, start + 1);
        }
        return chunks;
    }
    createEmbedding(text) {
        const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
        const tokens = this.tokenize(text);
        for (const token of tokens) {
            const hash = (0, crypto_1.createHash)('sha256').update(token).digest();
            const index = hash.readUInt16BE(0) % EMBEDDING_DIMENSIONS;
            const sign = hash[2] % 2 === 0 ? 1 : -1;
            vector[index] += sign * (1 + Math.min(token.length, 12) / 12);
        }
        const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
        return vector.map((value) => Number((value / magnitude).toFixed(6)));
    }
    cosineSimilarity(left, right) {
        let sum = 0;
        for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
            sum += left[index] * right[index];
        }
        return sum;
    }
    keywordBoost(question, chunk) {
        const questionTokens = new Set(this.tokenize(question));
        const chunkTokens = new Set(this.tokenize(chunk));
        if (!questionTokens.size || !chunkTokens.size) {
            return 0;
        }
        let matches = 0;
        for (const token of questionTokens) {
            if (chunkTokens.has(token)) {
                matches += 1;
            }
        }
        return matches / Math.max(questionTokens.size, 1) / 3;
    }
    tokenize(text) {
        return this.normalizeWhitespace(text)
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 2);
    }
    normalizeWhitespace(text) {
        return text.replace(/\s+/g, ' ').trim();
    }
    estimateTokenCount(text) {
        return Math.ceil(text.length / 4);
    }
};
exports.DocumentIndexingService = DocumentIndexingService;
exports.DocumentIndexingService = DocumentIndexingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __param(1, (0, typeorm_1.InjectRepository)(document_chunk_entity_1.DocumentChunk)),
    __param(2, (0, typeorm_1.InjectRepository)(document_embedding_entity_1.DocumentEmbedding)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        storage_service_1.StorageService])
], DocumentIndexingService);
//# sourceMappingURL=document-indexing.service.js.map