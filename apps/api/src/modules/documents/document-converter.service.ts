import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';

@Injectable()
export class DocumentConverterService {
  private readonly logger = new Logger(DocumentConverterService.name);

  async docxToHtml(buffer: Buffer): Promise<{ html: string; warnings: string[] }> {
    const result = await mammoth.convertToHtml({ buffer });
    return { html: result.value, warnings: result.messages.map((m) => m.message) };
  }

  async docxToText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
