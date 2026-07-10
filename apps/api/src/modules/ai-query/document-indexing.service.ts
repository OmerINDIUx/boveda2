import { createHash } from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'child_process';
import { inflateSync } from 'zlib';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { Repository } from 'typeorm';
import { StorageService } from '../../storage/storage.service';
import { DocumentChunk } from '../documents/document-chunk.entity';
import { DocumentEmbedding } from '../documents/document-embedding.entity';
import { DocumentRecord } from '../documents/document.entity';
import { DocumentVersion } from '../versions/document-version.entity';

type ExtractedSegment = {
  text: string;
  pageNumber?: number;
  sectionLabel?: string;
};

type ExtractedDocument = {
  contentType: 'pdf' | 'docx' | 'xlsx' | 'text';
  segments: ExtractedSegment[];
};

type IndexedChunk = {
  chunk: DocumentChunk;
  embedding: number[];
  score: number;
};

const EMBEDDING_DIMENSIONS = 256;
const EMBEDDING_PROVIDER = 'local';
const EMBEDDING_MODEL = 'holocron-hash-v1';
const OLLAMA_EMBEDDING_PROVIDER = 'ollama';
const OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';
const OLLAMA_EMBEDDING_DIMENSIONS = 768;
const EXTRACTION_PIPELINE_VERSION = 'pdf-v4';
const MAX_CHUNK_LENGTH = 2000;
const CHUNK_OVERLAP = 250;

@Injectable()
export class DocumentIndexingService {
  constructor(
    @InjectRepository(DocumentVersion) private readonly versions: Repository<DocumentVersion>,
    @InjectRepository(DocumentChunk) private readonly chunks: Repository<DocumentChunk>,
    @InjectRepository(DocumentEmbedding) private readonly embeddings: Repository<DocumentEmbedding>,
    private readonly storage: StorageService,
    private readonly config: ConfigService
  ) {}

  async ensureVersionIndexed(document: DocumentRecord, version: DocumentVersion) {
    const buffer = await this.storage.read(version.fileKey);
    const contentHash = `${EXTRACTION_PIPELINE_VERSION}:${createHash('sha256').update(buffer).digest('hex')}`;
    const alreadyIndexed =
      version.contentHash === contentHash &&
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
        select: { id: true },
      });
      const existingChunkIds = existingChunks.map((chunk) => chunk.id);

      if (existingChunkIds.length) {
        await this.embeddings
          .createQueryBuilder()
          .delete()
          .from(DocumentEmbedding)
          .where('chunk_id IN (:...chunkIds)', { chunkIds: existingChunkIds })
          .execute();
      }

      await this.chunks.delete({ documentId: document.id, versionId: version.id });

      if (rawChunks.length) {
        const savedChunks = await this.chunks.save(
          rawChunks.map((item, index) =>
            this.chunks.create({
              documentId: document.id,
              versionId: version.id,
              chunkIndex: index,
              content: item.content,
              tokenCount: item.tokenCount,
              pageNumber: item.pageNumber,
              sectionLabel: item.sectionLabel,
            })
          )
        );

        const embeddingData = [];
        for (const chunk of savedChunks) {
          const ollamaEmbedding = await this.createOllamaEmbedding(chunk.content).catch(() => null);
          if (ollamaEmbedding) {
            embeddingData.push(
              this.embeddings.create({
                chunkId: chunk.id,
                provider: OLLAMA_EMBEDDING_PROVIDER,
                model: OLLAMA_EMBEDDING_MODEL,
                dimensions: OLLAMA_EMBEDDING_DIMENSIONS,
                embedding: ollamaEmbedding,
                contentHash: createHash('sha256').update(chunk.content).digest('hex'),
              })
            );
          }
          embeddingData.push(
            this.embeddings.create({
              chunkId: chunk.id,
              provider: EMBEDDING_PROVIDER,
              model: EMBEDDING_MODEL,
              dimensions: EMBEDDING_DIMENSIONS,
              embedding: this.createHashEmbedding(chunk.content),
              contentHash: createHash('sha256').update(chunk.content).digest('hex'),
            })
          );
        }
        await this.embeddings.save(embeddingData);
      }

      version.contentHash = contentHash;
      version.contentExtractionStatus = 'completed';
      version.contentExtractionError = undefined;
      version.contentExtractedAt = new Date();
      await this.versions.save(version);
    } catch (error) {
      version.contentExtractionStatus = 'failed';
      version.contentExtractionError =
        error instanceof Error ? error.message : 'No fue posible extraer el contenido';
      await this.versions.save(version);
      throw error;
    }
  }

  async searchVisibleChunks(
    documentIds: string[],
    question: string,
    limit = 20
  ): Promise<IndexedChunk[]> {
    if (!documentIds.length) {
      return [];
    }

    const ollamaRows = await this.embeddings
      .createQueryBuilder('embedding')
      .innerJoinAndSelect('embedding.chunk', 'chunk')
      .where('chunk.documentId IN (:...documentIds)', { documentIds })
      .andWhere('embedding.provider = :provider', { provider: OLLAMA_EMBEDDING_PROVIDER })
      .andWhere('embedding.model = :model', { model: OLLAMA_EMBEDDING_MODEL })
      .getMany();

    const useOllama = ollamaRows.length > 0;

    let rows: typeof ollamaRows;
    let queryEmbedding: number[];

    if (useOllama) {
      rows = ollamaRows;
      queryEmbedding = await this.createOllamaEmbedding(question).catch(() =>
        this.createHashEmbedding(question)
      );
    } else {
      rows = await this.embeddings
        .createQueryBuilder('embedding')
        .innerJoinAndSelect('embedding.chunk', 'chunk')
        .where('chunk.documentId IN (:...documentIds)', { documentIds })
        .andWhere('embedding.provider = :provider', { provider: EMBEDDING_PROVIDER })
        .andWhere('embedding.model = :model', { model: EMBEDDING_MODEL })
        .getMany();
      queryEmbedding = this.createHashEmbedding(question);
    }

    const expandedQuestion = this.expandQuestion(question);
    return rows
      .map((embedding) => {
        const semanticScore = this.cosineSimilarity(queryEmbedding, embedding.embedding);
        const keywordMatches = this.keywordMatchCount(expandedQuestion, embedding.chunk.content);
        return {
          chunk: embedding.chunk,
          embedding: embedding.embedding,
          score: semanticScore + this.keywordBoost(expandedQuestion, embedding.chunk.content),
          semanticScore,
          keywordMatches,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private async extractText(
    fileName: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<ExtractedDocument> {
    if (mimeType === 'text/plain') {
      return {
        contentType: 'text',
        segments: [{ text: buffer.toString('utf8') }],
      };
    }

    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const pdftotext = await this.extractWithPdftotext(buffer).catch(() => null);
      if (pdftotext?.segments.length) {
        return pdftotext;
      }

      const extracted = this.extractPdfText(buffer);
      if (extracted.segments.length) {
        return extracted;
      }
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.toLowerCase().endsWith('.docx')
    ) {
      return this.extractDocxWithMammoth(buffer);
    }

    const pythonCode = `
import io, json, sys

file_name = sys.argv[1]
mime_type = sys.argv[2]
payload = sys.stdin.buffer.read()

def clean(text):
    if not text:
        return ""
    return " ".join(str(text).replace("\\x00", " ").split())

def extract_pdf(data):
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    segments = []
    for index, page in enumerate(reader.pages, start=1):
        text = clean(page.extract_text() or "")
        if text:
            segments.append({"text": text, "pageNumber": index})
    return {"contentType": "pdf", "segments": segments}

def extract_xlsx(data):
    from openpyxl import load_workbook
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
elif mime_type in ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel") or file_name.lower().endswith(".xlsx"):
    output = extract_xlsx(payload)
else:
    output = {"contentType": "text", "segments": [{"text": clean(payload.decode("utf-8", errors="ignore"))}]}

sys.stdout.write(json.dumps(output, ensure_ascii=True))
`;

    const pythonExecutable =
      process.env.HOLOCRON_PYTHON_PATH ?? process.env.PYTHON_PATH ?? 'python';
    const result = await this.runPython(pythonExecutable, pythonCode, [fileName, mimeType], buffer);
    try {
      const parsed = JSON.parse(result) as ExtractedDocument;
      return {
        contentType: parsed.contentType,
        segments: (parsed.segments ?? []).filter((segment) => segment.text?.trim().length),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `No se pudo interpretar la extraccion documental para ${fileName}: ${error instanceof Error ? error.message : 'error'}`
      );
    }
  }

  private async extractDocxWithMammoth(buffer: Buffer): Promise<ExtractedDocument> {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');

    return {
      contentType: 'docx',
      segments: text ? [{ text }] : [],
    };
  }

  private async runPython(
    executable: string,
    code: string,
    args: string[],
    stdin: Buffer
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, ['-c', code, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      child.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
      child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
      child.on('error', (error) =>
        reject(new InternalServerErrorException(`No fue posible iniciar Python: ${error.message}`))
      );
      child.on('close', (codeValue) => {
        if (codeValue !== 0) {
          reject(
            new InternalServerErrorException(
              `La extraccion documental fallo: ${Buffer.concat(stderr).toString('utf8') || `codigo ${codeValue}`}`
            )
          );
          return;
        }
        resolve(Buffer.concat(stdout).toString('utf8'));
      });

      child.stdin.write(stdin);
      child.stdin.end();
    });
  }

  private async extractWithPdftotext(buffer: Buffer): Promise<ExtractedDocument> {
    const segments: ExtractedSegment[] = [];
    const tmpDir = this.config.get<string>('TMP_DIR') ?? os.tmpdir();
    const tmpInput = path.join(tmpDir, `holocron_pdf_${Date.now()}.pdf`);
    const tmpOutput = path.join(tmpDir, `holocron_pdf_${Date.now()}.txt`);

    try {
      await fs.promises.writeFile(tmpInput, buffer);
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('pdftotext', ['-layout', tmpInput, tmpOutput]);
        let stderr = '';
        proc.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(stderr || `pdftotext exit code ${code}`));
        });
        proc.on('error', (err) => reject(err));
      });

      const text = await fs.promises.readFile(tmpOutput, 'utf8');
      const pages = text.split(/\f/).filter((p) => p.trim().length > 0);

      for (let i = 0; i < pages.length; i++) {
        const lines = pages[i].split('\n').filter((l) => l.trim().length > 0);
        if (!lines.length) continue;

        const combined = lines.join('\n');
        if (combined.trim().length < 20) continue;

        segments.push({
          text: combined.trim(),
          pageNumber: i + 1,
        });
      }
    } catch {
      return { contentType: 'pdf', segments: [] };
    } finally {
      try {
        await fs.promises.unlink(tmpInput);
      } catch {
        /* ignore */
      }
      try {
        await fs.promises.unlink(tmpOutput);
      } catch {
        /* ignore */
      }
    }

    return { contentType: 'pdf', segments };
  }

  private extractPdfText(buffer: Buffer): ExtractedDocument {
    const source = buffer.toString('latin1');
    const streamPattern = /<<(?:[^>]|>(?!>))*>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
    const unicodeMaps = this.buildPdfUnicodeMaps(source);
    const segments: ExtractedSegment[] = [];
    let match: RegExpExecArray | null;
    let pageNumber = 1;

    while ((match = streamPattern.exec(source)) !== null) {
      const block = match[0];
      const rawStream = Buffer.from(match[1], 'latin1');
      const decoded = this.decodePdfStream(block, rawStream);
      if (!decoded) {
        continue;
      }

      const extractedText = this.extractPdfTextFromStream(decoded, unicodeMaps);
      if (!extractedText) {
        continue;
      }

      segments.push({ text: extractedText, pageNumber });
      pageNumber += 1;
    }

    return {
      contentType: 'pdf',
      segments,
    };
  }

  private buildPdfUnicodeMaps(source: string) {
    const streamPattern = /<<(?:[^>]|>(?!>))*>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
    const unicodeMaps: Array<Map<number, string>> = [];
    let match: RegExpExecArray | null;

    while ((match = streamPattern.exec(source)) !== null) {
      const block = match[0];
      const rawStream = Buffer.from(match[1], 'latin1');
      const decoded = this.decodePdfStream(block, rawStream);
      if (!decoded || !decoded.includes('begincmap')) {
        continue;
      }

      const unicodeMap = new Map<number, string>();
      const bfcharSections = decoded.match(/beginbfchar[\s\S]*?endbfchar/g) ?? [];
      for (const section of bfcharSections) {
        const entries = section.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) ?? [];
        for (const entry of entries) {
          const parts = entry.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
          if (!parts) {
            continue;
          }

          unicodeMap.set(Number.parseInt(parts[1], 16), this.decodePdfUnicodeHex(parts[2]));
        }
      }

      const bfrangeSections = decoded.match(/beginbfrange[\s\S]*?endbfrange/g) ?? [];
      for (const section of bfrangeSections) {
        const entries =
          section.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) ?? [];
        for (const entry of entries) {
          const parts = entry.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
          if (!parts) {
            continue;
          }

          const start = Number.parseInt(parts[1], 16);
          const end = Number.parseInt(parts[2], 16);
          let target = Number.parseInt(parts[3], 16);
          for (let code = start; code <= end; code += 1) {
            unicodeMap.set(
              code,
              this.decodePdfUnicodeHex(target.toString(16).padStart(parts[3].length, '0'))
            );
            target += 1;
          }
        }
      }

      if (unicodeMap.size) {
        unicodeMaps.push(unicodeMap);
      }
    }

    return unicodeMaps;
  }

  private decodePdfStream(block: string, rawStream: Buffer) {
    try {
      if (/\/Filter\s*(?:\[\s*)?\/FlateDecode\b/.test(block)) {
        return inflateSync(rawStream).toString('latin1');
      }

      return rawStream.toString('latin1');
    } catch {
      return '';
    }
  }

  private extractPdfTextFromStream(stream: string, unicodeMaps: Array<Map<number, string>>) {
    const blocks = stream.match(/BT[\s\S]*?ET/g) ?? [];
    const parts: string[] = [];

    for (const block of blocks) {
      const arrays = block.match(/\[(?:.|\r|\n)*?\]\s*TJ/g) ?? [];
      for (const arrayToken of arrays) {
        const content = arrayToken.slice(0, arrayToken.lastIndexOf(']'));
        const text = this.decodePdfArrayText(content, unicodeMaps);
        if (text) {
          parts.push(text);
        }
      }

      const hexTokens = block.match(/<([0-9A-Fa-f\s]+)>\s*Tj/g) ?? [];
      for (const token of hexTokens) {
        const hex = token.slice(1, token.indexOf('>'));
        const text = this.decodePdfHexString(hex, unicodeMaps);
        if (text) {
          parts.push(text);
        }
      }

      const literalTokens = block.match(/\((?:\\.|[^\\()])*\)\s*Tj/g) ?? [];
      for (const token of literalTokens) {
        const literal = token.slice(1, token.lastIndexOf(')'));
        const text = this.decodePdfLiteralString(literal, unicodeMaps);
        if (text) {
          parts.push(text);
        }
      }
    }

    return this.normalizeWhitespace(parts.join(' '));
  }

  private decodePdfArrayText(content: string, unicodeMaps: Array<Map<number, string>>) {
    const tokens = content.match(/<[^>]+>|\((?:\\.|[^\\()])*\)/g) ?? [];
    const pieces = tokens
      .map((token) => {
        if (token.startsWith('<')) {
          return this.decodePdfHexString(token.slice(1, -1), unicodeMaps);
        }

        return this.decodePdfLiteralString(token.slice(1, -1), unicodeMaps);
      })
      .filter(Boolean);

    return this.normalizeWhitespace(pieces.join(''));
  }

  private decodePdfHexString(hex: string, unicodeMaps: Array<Map<number, string>>) {
    const normalized = hex.replace(/\s+/g, '');
    if (!normalized || normalized.length % 2 !== 0) {
      return '';
    }

    const bytes = Buffer.from(normalized, 'hex');
    const looksLikeWordCodes =
      normalized.length % 4 === 0 &&
      bytes.every((_, index) => (index % 2 === 0 ? bytes[index] === 0 : true));

    if (looksLikeWordCodes) {
      const codes: number[] = [];
      for (let index = 0; index < bytes.length; index += 2) {
        codes.push(bytes.readUInt16BE(index));
      }
      return this.decodePdfCharCodes(codes, unicodeMaps);
    }

    return this.decodePdfCharCodes([...bytes], unicodeMaps);
  }

  private decodePdfLiteralString(literal: string, unicodeMaps: Array<Map<number, string>>) {
    const bytes: number[] = [];
    for (let index = 0; index < literal.length; index += 1) {
      const current = literal[index];
      if (current !== '\\') {
        bytes.push(current.charCodeAt(0));
        continue;
      }

      const next = literal[index + 1];
      if (next === undefined) {
        break;
      }

      index += 1;
      if (/[0-7]/.test(next)) {
        let octal = next;
        while (index + 1 < literal.length && octal.length < 3 && /[0-7]/.test(literal[index + 1])) {
          octal += literal[index + 1];
          index += 1;
        }
        bytes.push(Number.parseInt(octal, 8));
        continue;
      }

      const escaped: Record<string, number> = {
        n: 10,
        r: 13,
        t: 9,
        b: 8,
        f: 12,
        '(': 40,
        ')': 41,
        '\\': 92,
      };
      bytes.push(escaped[next] ?? next.charCodeAt(0));
    }

    return this.decodePdfCharCodes(bytes, unicodeMaps);
  }

  private decodePdfCharCodes(codes: number[], unicodeMaps: Array<Map<number, string>>) {
    const candidates = unicodeMaps
      .map((unicodeMap) =>
        this.normalizeWhitespace(codes.map((code) => unicodeMap.get(code) ?? '').join(''))
      )
      .filter(Boolean);

    if (candidates.length) {
      return candidates.sort(
        (left, right) => this.scoreDecodedPdfText(right) - this.scoreDecodedPdfText(left)
      )[0];
    }

    const fallbackCandidates = [this.codesToText(codes, 0), this.codesToText(codes, -3)]
      .map((candidate) => this.normalizeWhitespace(candidate))
      .filter(Boolean);

    if (!fallbackCandidates.length) {
      return '';
    }

    return fallbackCandidates.sort(
      (left, right) => this.scoreDecodedPdfText(right) - this.scoreDecodedPdfText(left)
    )[0];
  }

  private decodePdfUnicodeHex(hex: string) {
    const normalized = hex.replace(/\s+/g, '');
    if (!normalized || normalized.length % 4 !== 0) {
      return '';
    }

    const bytes = Buffer.from(normalized, 'hex');
    let output = '';
    for (let index = 0; index < bytes.length; index += 2) {
      output += String.fromCharCode(bytes.readUInt16BE(index));
    }
    return output;
  }

  private codesToText(codes: number[], shift: number) {
    return codes
      .map((code) => {
        const shifted = code + shift;
        if (shifted === 9 || shifted === 10 || shifted === 13 || shifted === 32) {
          return ' ';
        }
        if (shifted < 32 || shifted > 126) {
          return '';
        }
        return String.fromCharCode(shifted);
      })
      .join('');
  }

  private scoreDecodedPdfText(text: string) {
    const visibleMatches = text.match(/[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ,.;:()/%$#@!?\- ]/g) ?? [];
    const vowels = text.match(/[AEIOUÁÉÍÓÚÜaeiouáéíóúü]/g) ?? [];
    const weirdSymbols = text.match(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ,.;:()/%$#@!?\-\s]/g) ?? [];
    const longWordBonus = text.split(/\s+/).filter((word) => word.length >= 4).length * 3;
    return visibleMatches.length + vowels.length * 2 + longWordBonus - weirdSymbols.length * 4;
  }

  private buildChunks(
    document: DocumentRecord,
    version: DocumentVersion,
    extracted: ExtractedDocument
  ) {
    const segments: Array<{
      content: string;
      tokenCount: number;
      pageNumber?: number;
      sectionLabel?: string;
    }> = [];

    for (const segment of extracted.segments) {
      const normalized = this.normalizeWhitespace(segment.text);
      if (!normalized) {
        continue;
      }

      for (const piece of this.splitLongText(normalized)) {
        const prefixed = this.prefixChunkMetadata(
          piece,
          document.name,
          version.revision,
          segment.pageNumber,
          segment.sectionLabel
        );
        segments.push({
          content: prefixed,
          tokenCount: this.estimateTokenCount(prefixed),
          pageNumber: segment.pageNumber,
          sectionLabel: segment.sectionLabel,
        });
      }
    }

    if (segments.length) {
      return segments;
    }

    const header = [
      `Documento: ${document.name}`,
      `Numero: ${document.documentNumber}`,
      `Version: ${version.revision}`,
      `Estado: ${document.status}`,
      document.dueDate ? `Vence: ${document.dueDate}` : undefined,
      document.confidentialityLevel
        ? `Confidencialidad: ${document.confidentialityLevel}`
        : undefined,
      version.notes ? `Notas de version: ${version.notes}` : undefined,
    ]
      .filter(Boolean)
      .join('. ');

    if (header) {
      segments.push({
        content: header,
        tokenCount: this.estimateTokenCount(header),
        sectionLabel: 'Resumen documental',
      });
    }

    return segments;
  }

  private splitLongText(text: string) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length <= 1) {
      if (text.length <= MAX_CHUNK_LENGTH) {
        return [text];
      }

      const chunks: string[] = [];
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

    const chunks: string[] = [];
    let current = '';
    for (const paragraph of paragraphs) {
      if ((current + '\n\n' + paragraph).length > MAX_CHUNK_LENGTH && current.length > 0) {
        chunks.push(current.trim());
        current = paragraph;
      } else {
        current = current ? current + '\n\n' + paragraph : paragraph;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks.length ? chunks : [text];
  }

  private prefixChunkMetadata(
    content: string,
    documentName: string,
    versionLabel: string,
    pageNumber?: number,
    sectionLabel?: string
  ) {
    const parts: string[] = [];
    parts.push(`[Documento: ${documentName}]`);
    parts.push(`[Version: ${versionLabel}]`);
    if (pageNumber) parts.push(`[Pagina: ${pageNumber}]`);
    if (sectionLabel) parts.push(`[Seccion: ${sectionLabel}]`);
    return `${parts.join(' ')}\n${content}`;
  }

  private createHashEmbedding(text: string) {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const tokens = this.tokenize(text);
    for (const token of tokens) {
      const hash = createHash('sha256').update(token).digest();
      const index = hash.readUInt16BE(0) % EMBEDDING_DIMENSIONS;
      const sign = hash[2] % 2 === 0 ? 1 : -1;
      vector[index] += sign * (1 + Math.min(token.length, 12) / 12);
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => Number((value / magnitude).toFixed(6)));
  }

  private async createOllamaEmbedding(text: string): Promise<number[]> {
    const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_EMBEDDING_MODEL,
          input: text.slice(0, 8000),
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embedding error: ${response.status}`);
      }

      const payload = (await response.json()) as { embeddings?: number[][] };
      const embedding = payload.embeddings?.[0];
      if (!embedding || !embedding.length) {
        throw new Error('Ollama returned empty embedding');
      }

      return embedding;
    } finally {
      clearTimeout(timeout);
    }
  }

  private cosineSimilarity(left: number[], right: number[]) {
    let sum = 0;
    for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
      sum += left[index] * right[index];
    }
    return sum;
  }

  private keywordBoost(question: string, chunk: string) {
    const matches = this.keywordMatchCount(question, chunk);
    const questionTokens = new Set(this.tokenize(question));
    if (!questionTokens.size) {
      return 0;
    }

    return matches / Math.max(questionTokens.size, 1) / 3;
  }

  private keywordMatchCount(question: string, chunk: string) {
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

    return matches;
  }

  private isBroadDocumentQuestion(question: string) {
    return /(resume|resumen|sintetiza|de que trata|que contiene|que hay dentro|que informacion tiene|que es este documento|que muestra|muestra este pdf|informacion general|descripcion general)/i.test(
      question
    );
  }

  private isInvoiceQuestion(question: string) {
    return /(factura|invoice|comprobante|recibo|cobro)/i.test(question);
  }

  private isAmountQuestion(question: string) {
    return /(monto|montos|importe|total|cuanto|cuesta|costo|precio|valor|pagar|pago)/i.test(
      question
    );
  }

  private expandQuestion(question: string) {
    const normalized = this.normalizeWhitespace(question);
    const expansions: string[] = [normalized];

    if (this.isInvoiceQuestion(normalized)) {
      expansions.push(
        'invoice billed bill billing bill to due on due date vat tax subtotal total amount receipt payment paid supplier customer'
      );
    }

    if (this.isAmountQuestion(normalized)) {
      expansions.push(
        'amount total subtotal due paid payment price cost charge invoice usd mxn eur aud $'
      );
    }

    if (/envato/i.test(normalized)) {
      expansions.push('envato elements elements.envato.com notices@elements.envato.com');
    }

    if (
      this.isBroadDocumentQuestion(normalized) ||
      /(documento|pdf|archivo|contenido)/i.test(normalized)
    ) {
      expansions.push(
        'invoice billed bill to due on total amount vat email address customer supplier description details'
      );
    }

    return expansions.join(' ');
  }

  private tokenize(text: string) {
    const baseTokens = this.normalizeWhitespace(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);

    const tokens = new Set(baseTokens);
    for (const token of baseTokens) {
      if (token.length < 8) {
        continue;
      }

      for (const size of [5, 8, 10]) {
        if (token.length < size) {
          continue;
        }

        for (let index = 0; index <= token.length - size; index += 1) {
          tokens.add(token.slice(index, index + size));
        }
      }
    }

    return [...tokens];
  }

  private normalizeWhitespace(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  private estimateTokenCount(text: string) {
    return Math.ceil(text.length / 4);
  }
}
