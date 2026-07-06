import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

type OllamaCitation = {
  documentName: string;
  versionLabel: string;
  pageNumber?: number;
  fragment: string;
};

type OllamaAnswerResult = {
  answer?: string;
  error?: string;
};

@Injectable()
export class OllamaChatService {
  constructor(private readonly config: ConfigService) {}

  async answer(question: string, citations: OllamaCitation[]): Promise<OllamaAnswerResult> {
    const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.1';
    const timeoutMs = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS') ?? 120000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: 'system',
              content: [
                'Eres un asistente de consulta documental para una boveda empresarial.',
                'Responde en espanol claro y directo usando solo la evidencia proporcionada.',
                'No inventes datos. Si la evidencia no permite responder, dilo explicitamente.',
                'No pegues fragmentos crudos salvo que sean datos puntuales como folios, importes, fechas o correos.',
                'Cuando el usuario pregunte por montos, identifica importes, moneda y concepto si aparecen.',
                'Cuando el usuario pregunte si es factura, decide por senales documentales como Invoice, Bill To, VAT, Total, Due o datos fiscales.',
              ].join(' '),
            },
            {
              role: 'user',
              content: `Pregunta: ${question}\n\nEvidencia autorizada:\n${this.formatEvidence(citations)}`,
            },
          ],
          options: {
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        return {
          error: `Ollama respondio ${response.status}. Revisa que el modelo "${model}" este instalado.${detail ? ` Detalle: ${detail.slice(0, 180)}` : ''}`,
        };
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content?.trim();
      return content ? { answer: content } : { error: 'Ollama respondio sin contenido.' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { error: `Ollama no respondio antes de ${timeoutMs} ms.` };
      }

      return {
        error: `No pude conectar con Ollama en ${baseUrl}. Inicia Ollama o ajusta OLLAMA_BASE_URL.`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private formatEvidence(citations: OllamaCitation[]) {
    return citations
      .slice(0, 6)
      .map((citation, index) => {
        const page = citation.pageNumber
          ? `pagina ${citation.pageNumber}`
          : 'pagina no identificada';
        return [
          `[${index + 1}] Documento: ${citation.documentName}`,
          `Version: ${citation.versionLabel}`,
          `Ubicacion: ${page}`,
          `Texto: ${citation.fragment}`,
        ].join('\n');
      })
      .join('\n\n');
  }
}
