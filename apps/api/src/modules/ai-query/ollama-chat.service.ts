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

type OllamaContractExtractionResult = {
  content?: string;
  error?: string;
  model: string;
};

type OllamaTranscriptionNormalizationResult = {
  content?: string;
  error?: string;
  model: string;
};

type OllamaBilingualQueryResult = {
  spanish?: string;
  english?: string;
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
                'Detecta el idioma de la pregunta y responde en ese mismo idioma.',
                'La evidencia puede estar en espanol o ingles; comprende y traduce sus conceptos cuando sea necesario.',
                'La evidencia puede estar incompleta o fragmentada. Responde con lo que tengas.',
                'No inventes datos. Si la evidencia no permite responder, dilo explicitamente con la frase "Con la informacion disponible en los documentos," y luego responde lo que puedas.',
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

  async extractContractFacts(evidence: string): Promise<OllamaContractExtractionResult> {
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
          format: 'json',
          messages: [
            {
              role: 'system',
              content: [
                'Eres un analista contractual. Extrae solamente hechos expresos de la evidencia.',
                'Devuelve JSON valido con la forma {"facts": [...]}.',
                'Cada hecho debe contener category, field, label, value, confidence, pageNumber y evidence.',
                'Categorias permitidas: general, dates, parties, penalties, guarantees, deliverables, obligations, payments, milestones, risks.',
                'Para general usa campos name, contractType, responsibleArea, amount, currency, renewable o renewalNoticeDays.',
                'Para dates usa startDate, endDate o renewalDate y fechas ISO YYYY-MM-DD.',
                'Para parties usa clientName o supplierName.',
                'Para penalties usa field penalty y un value objeto con title, description, percentage, capPercentage, trigger, frequency, basisClause, calculation, amount y currency.',
                'En penalties amount solo es una pena fija expresada literalmente con moneda; nunca calcules amount multiplicando el porcentaje por el monto del contrato.',
                'Para guarantees usa field guarantee y un value objeto con title, description, issuer, beneficiary, durationMonths, startCondition, coverage, validFrom, validUntil, amount, currency y basisClause.',
                'En guarantees no copies el monto ni la moneda del contrato. validFrom y validUntil solo aceptan fechas calendario expresas; una duración relativa pertenece a durationMonths y startCondition.',
                'Para deliverables usa field deliverable y un value objeto con name, description, dueDate y acceptanceCriteria. Devuelve un hecho separado por cada elemento de una lista de entregables.',
                'Para obligations el value debe ser objeto con description, commitmentDate, periodicity, priority y consequence.',
                'Para payments el value debe ser objeto con concept, amount, currency, percentage, condition, paymentDate, dueDate y notes. No calcules amount a partir del monto total cuando la cláusula solo indique un porcentaje.',
                'Para milestones el value debe ser objeto con name, milestoneDate y notes.',
                'Para risks el value debe ser objeto con description, severity y recommendation.',
                'REGLA DE ATOMICIDAD: cada inciso, numeral, viñeta, obligación, entregable, pago, hito o riesgo debe ser un hecho separado. Nunca juntes varios elementos en description, name, concept ni notes.',
                'Si una cláusula enumera cinco obligaciones, devuelve cinco facts de obligations; esto permite gestionar y marcar cada registro por separado.',
                'confidence debe estar entre 0 y 1. Usa null para datos desconocidos y no inventes valores.',
                'Omite hechos sin evidencia suficiente. evidence debe ser una cita breve del texto.',
                'Cada valor debe proceder de la misma cláusula citada. No uses correos, nombres, importes o fechas de otras páginas para completar campos vacíos.',
              ].join(' '),
            },
            {
              role: 'user',
              content: evidence.slice(0, 60000),
            },
          ],
          options: { temperature: 0 },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        return {
          model,
          error: `Ollama respondio ${response.status}.${detail ? ` ${detail.slice(0, 180)}` : ''}`,
        };
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content?.trim();
      return content ? { content, model } : { model, error: 'Ollama respondio sin contenido.' };
    } catch (error) {
      return {
        model,
        error:
          error instanceof Error && error.name === 'AbortError'
            ? `Ollama no respondio antes de ${timeoutMs} ms.`
            : `No pude conectar con Ollama en ${baseUrl}.`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async normalizeContractTranscription(
    transcription: string,
    pageNumber?: number
  ): Promise<OllamaTranscriptionNormalizationResult> {
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
                'Eres un restaurador de transcripciones contractuales extraidas de PDF.',
                'Reconstruye palabras pegadas, espacios, acentos, parrafos, encabezados y listas.',
                'Si detectas una tabla, representala como tabla Markdown conservando sus filas y columnas.',
                'Elimina numeros o marcadores sueltos que sean residuos del orden interno del PDF, pero conserva numerales que pertenezcan a clausulas o listas reales.',
                'No resumas, no interpretes, no completes datos ausentes y no cambies nombres, fechas, porcentajes, monedas ni importes.',
                'Devuelve unicamente la transcripcion restaurada, sin explicaciones ni bloques de codigo.',
              ].join(' '),
            },
            {
              role: 'user',
              content: `Pagina ${pageNumber ?? 'no identificada'}:\n\n${transcription.slice(0, 40000)}`,
            },
          ],
          options: { temperature: 0 },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        return {
          model,
          error: `Ollama respondio ${response.status}.${detail ? ` ${detail.slice(0, 180)}` : ''}`,
        };
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content?.trim();
      return content ? { content, model } : { model, error: 'Ollama respondio sin contenido.' };
    } catch (error) {
      return {
        model,
        error:
          error instanceof Error && error.name === 'AbortError'
            ? `Ollama no respondio antes de ${timeoutMs} ms.`
            : `No pude conectar con Ollama en ${baseUrl}.`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async expandBilingualQuery(question: string): Promise<OllamaBilingualQueryResult> {
    const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.1';
    const timeoutMs = Number(this.config.get<string>('OLLAMA_QUERY_EXPANSION_TIMEOUT_MS') ?? 30000);
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
          format: 'json',
          messages: [
            {
              role: 'system',
              content: [
                'Genera dos versiones semanticamente equivalentes de una consulta contractual.',
                'Devuelve solamente JSON con la forma {"spanish":"...","english":"..."}.',
                'Conserva nombres propios, folios, fechas, porcentajes, monedas e importes sin modificarlos.',
                'No respondas la pregunta y no agregues hechos.',
              ].join(' '),
            },
            { role: 'user', content: question.slice(0, 4000) },
          ],
          options: { temperature: 0 },
        }),
      });
      if (!response.ok) return { error: `Ollama respondio ${response.status}.` };
      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content?.trim();
      if (!content) return { error: 'Ollama respondio sin contenido.' };
      const parsed = JSON.parse(content) as { spanish?: unknown; english?: unknown };
      return {
        spanish: typeof parsed.spanish === 'string' ? parsed.spanish.trim() : undefined,
        english: typeof parsed.english === 'string' ? parsed.english.trim() : undefined,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error && error.name === 'AbortError'
            ? `Ollama no respondio antes de ${timeoutMs} ms.`
            : 'No fue posible generar la consulta bilingue.',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private formatEvidence(citations: OllamaCitation[]) {
    return citations
      .slice(0, 12)
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
