import * as bcrypt from 'bcrypt';
import { ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ContractExtractionService } from './contract-extraction.service';

function createService(runOverrides: Record<string, unknown> = {}) {
  const service = Object.create(ContractExtractionService.prototype) as ContractExtractionService;
  const run = {
    id: 'run-1',
    contractId: 'contract-1',
    versionId: 'version-1',
    uploadedById: 'user-1',
    status: 'draft_ready',
    facts: [],
    ...runOverrides,
  };
  Reflect.set(service, 'runs', {
    findOne: jest.fn().mockResolvedValue(run),
    save: jest.fn().mockImplementation(async (value: unknown) => value),
  });
  return { service, run };
}

describe('ContractExtractionService', () => {
  it('conserva penalizaciones y garantías como hallazgos estructurados', () => {
    const { service } = createService();
    const parseFacts = Reflect.get(service, 'parseFacts').bind(service) as (
      content: string
    ) => Array<{ category: string; field: string }>;

    const facts = parseFacts(
      JSON.stringify({
        facts: [
          {
            category: 'penalties',
            field: 'penalty',
            label: 'Pena por atraso',
            value: { title: 'Pena por atraso', percentage: 1 },
            confidence: 0.95,
          },
          {
            category: 'guarantees',
            field: 'guarantee',
            label: 'Garantía de cumplimiento',
            value: { title: 'Garantía de cumplimiento', validUntil: '2027-12-31' },
            confidence: 0.9,
          },
          {
            category: 'deliverables',
            field: 'deliverable',
            label: 'Informe final',
            value: { name: 'Informe final', dueDate: '2027-11-30' },
            confidence: 0.92,
          },
        ],
      })
    );

    expect(facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'penalties', field: 'penalty' }),
        expect.objectContaining({ category: 'guarantees', field: 'guarantee' }),
        expect.objectContaining({ category: 'deliverables', field: 'deliverable' }),
      ])
    );
  });

  it('acepta respuestas vacías y envolturas alternativas de Ollama', () => {
    const { service } = createService();
    const parseFacts = Reflect.get(service, 'parseFacts').bind(service) as (
      content: string
    ) => Array<{ category: string; field: string; value: unknown }>;

    expect(parseFacts('{}')).toEqual([]);
    expect(
      parseFacts(
        JSON.stringify({
          data: [
            {
              category: 'general',
              field: 'name',
              value: 'Contrato de obra',
              confidence: 0.9,
            },
          ],
        })
      )
    ).toEqual([
      expect.objectContaining({
        category: 'general',
        field: 'name',
        value: 'Contrato de obra',
      }),
    ]);
    expect(
      parseFacts(
        JSON.stringify({
          obligations: [
            {
              field: 'obligation',
              value: { description: 'Entregar el reporte mensual.' },
              confidence: 0.8,
            },
          ],
        })
      )
    ).toEqual([
      expect.objectContaining({
        category: 'obligations',
        field: 'obligation',
      }),
    ]);
  });

  it('detecta texto concatenado o fragmentado de una capa PDF defectuosa', () => {
    const { service } = createService();
    const isLikelyGarbledText = Reflect.get(service, 'isLikelyGarbledText').bind(service) as (
      value: string
    ) => boolean;

    expect(
      isLikelyGarbledText(
        'ELCONTRATISTA I LACONAGUA oeaiizaodescuentosaimontoiniciaimente convenidoeneipoesentecvontrolsaivoqueaiaconclusindeiostrabajoscontrataal LASPARTES acrediten qulater'
      )
    ).toBe(true);
    expect(
      isLikelyGarbledText(
        'OMOS J BM4 J BM4 J oj J OM J oc J im J m J lo J MMPU mgina ON de P N soporte de efectos de pago.'
      )
    ).toBe(true);
    expect(
      isLikelyGarbledText(
        'El contratista realizará descuentos al monto inicialmente convenido en el presente contrato, salvo que a la conclusión de los trabajos las partes acrediten cualquier diferencia.'
      )
    ).toBe(false);
  });

  it('conserva directamente las páginas legibles sin volver a deformarlas con Ollama', async () => {
    const { service } = createService();
    const normalizeContractTranscription = jest.fn();
    Reflect.set(service, 'ollama', { normalizeContractTranscription });
    const normalizeSegments = Reflect.get(service, 'normalizeSegments').bind(service) as (
      segments: Array<{ text: string; pageNumber?: number }>
    ) => Promise<Array<{ text: string; normalizationMethod?: string }>>;
    const readable =
      'CONTRATO DE OBRA PÚBLICA. El contratista ejecutará los trabajos conforme a las especificaciones y al programa autorizado.';

    const result = await normalizeSegments([{ text: readable, pageNumber: 19 }]);

    expect(normalizeContractTranscription).not.toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        text: readable,
        normalizationMethod: 'deterministic',
      }),
    ]);
  });

  it('descarta datos ilegibles aunque el modelo les asigne confianza total', () => {
    const { service } = createService();
    const parseFacts = Reflect.get(service, 'parseFacts').bind(service) as (
      content: string
    ) => Array<{ field: string; value: unknown }>;

    const facts = parseFacts(
      JSON.stringify({
        facts: [
          {
            category: 'general',
            field: 'amount',
            value:
              'cincuentapoociento F abiimpooteoriginaliestablecidoodeimiazodeejecucin odeambos I',
            confidence: 1,
          },
          {
            category: 'general',
            field: 'currency',
            value: 'MXN',
            confidence: 0.94,
          },
        ],
      })
    );

    expect(facts).toEqual([
      expect.objectContaining({
        field: 'currency',
        value: 'MXN',
      }),
    ]);
  });

  it('extrae del contrato de obra términos sin inventar importes ni fechas', () => {
    const { service } = createService();
    const extract = Reflect.get(service, 'extractDeterministicSpecialFacts').bind(service) as (
      chunks: Array<{ content: string; pageNumber?: number }>
    ) => Array<{ category: string; value: Record<string, unknown> }>;

    const facts = extract([
      {
        pageNumber: 2,
        content: [
          'SEGUNDA. ENTREGABLES',
          'EL CONTRATISTA deberá entregar:',
          '1. Área administrativa terminada conforme a los planos proporcionados por EL CLIENTE.',
          '2. Instalación eléctrica funcional.',
          '3. Acabados interiores concluidos.',
          '4. Reporte fotográfico final.',
          '5. Acta de entrega física de la obra.',
          'TERCERA. PLAZO DE EJECUCIÓN',
          'La fecha estimada de terminación será el 3 de septiembre de 2026.',
          'CUARTA. MONTO DEL CONTRATO',
          'El monto total del contrato será de $2,500,000.00 MXN.',
          'El pago se realizará de la siguiente manera:',
          '1. 30 % de anticipo.',
          '2. 40 % contra avance físico del 50 %.',
          '3. 20 % contra terminación de los trabajos.',
          '4. 10 % contra firma del acta de entrega.',
          'QUINTA. RESPONSABILIDADES DE EL CONTRATISTA',
        ].join('\n'),
      },
      {
        pageNumber: 3,
        content: [
          'NOVENA. PENALIZACIONES',
          'En caso de retraso atribuible a EL CONTRATISTA, se aplicará una penalización equivalente al 0.5 % del monto total del contrato por cada semana de retraso, con un límite máximo del 10 %.',
          'DÉCIMA. GARANTÍA',
          'EL CONTRATISTA garantiza los trabajos por un periodo de 6 meses contados a partir de la firma del acta de entrega.',
          'DÉCIMA PRIMERA. TERMINACIÓN ANTICIPADA',
        ].join('\n'),
      },
    ]);

    expect(facts.filter((fact) => fact.category === 'deliverables')).toHaveLength(5);
    expect(facts.filter((fact) => fact.category === 'payments')).toHaveLength(4);
    expect(facts.find((fact) => fact.category === 'penalties')?.value).toEqual(
      expect.objectContaining({
        percentage: 0.5,
        capPercentage: 10,
        frequency: 'semana de retraso',
        amount: undefined,
      })
    );
    expect(facts.find((fact) => fact.category === 'guarantees')?.value).toEqual(
      expect.objectContaining({
        durationMonths: 6,
        startCondition: 'la firma del acta de entrega',
        amount: undefined,
        validFrom: undefined,
        validUntil: undefined,
      })
    );
  });

  it('separa una lista extraída en registros gestionables independientes', () => {
    const { service } = createService();
    const split = Reflect.get(service, 'splitTrackableFacts').bind(service) as (
      facts: Array<Record<string, unknown>>
    ) => Array<{ category: string; label: string; value: Record<string, unknown> }>;

    const facts = split([
      {
        id: 'combined-obligations',
        category: 'obligations',
        field: 'obligation',
        label: 'Obligaciones',
        value: {
          description:
            '1. Mantener limpia la obra. 2. Entregar el reporte final. 3. Corregir defectos.',
          priority: 'medium',
        },
        confidence: 0.9,
        decision: 'pending',
      },
    ]);

    expect(facts).toHaveLength(3);
    expect(facts.map((fact) => fact.value.description)).toEqual([
      'Mantener limpia la obra.',
      'Entregar el reporte final.',
      'Corregir defectos.',
    ]);
    expect(facts.every((fact) => fact.category === 'obligations')).toBe(true);
  });

  it('no acepta una restauración que pierda la estructura numerada', () => {
    const { service } = createService();
    const preserves = Reflect.get(service, 'preservesEnumeratedStructure').bind(service) as (
      source: string,
      restored: string
    ) => boolean;
    const source = [
      '1. Primer entregable.',
      '2. Segundo entregable.',
      '3. Tercer entregable.',
    ].join('\n');

    expect(preserves(source, 'Primer entregable, segundo entregable y tercer entregable.')).toBe(
      false
    );
    expect(preserves(source, source)).toBe(true);
  });

  it('procesa documentos extensos con slots limitados y conserva el orden', async () => {
    const { service } = createService();
    const mapWithConcurrency = Reflect.get(service, 'mapWithConcurrency').bind(service) as <T, R>(
      items: T[],
      slots: number,
      worker: (item: T) => Promise<R>
    ) => Promise<R[]>;
    let active = 0;
    let maximumActive = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (item) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, item % 2 ? 4 : 1));
      active -= 1;
      return item * 10;
    });

    expect(maximumActive).toBe(2);
    expect(results).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it('divide la evidencia por tamaño y cantidad sin perder fragmentos', () => {
    const { service } = createService();
    const buildBatches = Reflect.get(service, 'buildFactExtractionBatches').bind(service) as (
      chunks: Array<{ content: string; pageNumber?: number }>
    ) => string[];
    const chunks = Array.from({ length: 14 }, (_, index) => ({
      pageNumber: index + 1,
      content: `Fragmento-${index + 1} ${'x'.repeat(4900)}`,
    }));

    const batches = buildBatches(chunks);

    expect(batches.length).toBeGreaterThan(2);
    expect(batches.every((batch) => batch.length <= 12000)).toBe(true);
    expect(batches.every((batch) => (batch.match(/\[Pagina /g) ?? []).length <= 3)).toBe(true);
    for (let index = 0; index < chunks.length; index += 1) {
      expect(batches.join('\n')).toContain(`Fragmento-${index + 1} `);
    }
  });

  it('subdivide y recupera un lote cuando Ollama devuelve una estructura inválida', async () => {
    const { service } = createService();
    let call = 0;
    const extractContractFacts = jest.fn().mockImplementation(async () => {
      call += 1;
      if (call === 1) {
        return {
          content: JSON.stringify({ summary: 'respuesta sin lista' }),
          model: 'llama3.1',
        };
      }
      return {
        content: JSON.stringify({
          facts: [
            {
              category: 'general',
              field: 'name',
              value: `Contrato recuperado ${call}`,
              confidence: 0.9,
            },
          ],
        }),
        model: 'llama3.1',
      };
    });
    Reflect.set(service, 'ollama', { extractContractFacts });
    const recover = Reflect.get(service, 'extractFactsResiliently').bind(service) as (
      evidence: string
    ) => Promise<{ facts: Array<{ value: unknown }>; errors: string[] }>;

    const result = await recover(
      `[Pagina 1]\n${'a'.repeat(2200)}\n\n[Pagina 2]\n${'b'.repeat(2200)}`
    );

    expect(extractContractFacts).toHaveBeenCalledTimes(3);
    expect(result.errors).toEqual([]);
    expect(result.facts).toHaveLength(2);
  });

  it('reanuda la extracción y procesa únicamente los lotes que no estaban guardados', async () => {
    const buffer = Buffer.from('contrato reanudable');
    const contentHash = `contract-v7-clean-pdf-checkpoints:${createHash('sha256')
      .update(buffer)
      .digest('hex')}`;
    const firstEvidence = '[Pagina 1]\nPrimer lote';
    const secondEvidence = '[Pagina 2]\nSegundo lote';
    const firstKey = createHash('sha256').update(firstEvidence).digest('hex');
    const run = {
      id: 'run-resume',
      contractId: 'contract-1',
      versionId: 'version-1',
      uploadedById: 'user-1',
      status: 'queued',
      progressPercent: 75,
      processingStage: 'resuming',
      pipelineVersion: 'contract-v7-clean-pdf-checkpoints',
      contentHash,
      facts: [],
      checkpoint: {
        contentHash,
        stage: 'extracting_facts',
        totalBatches: 2,
        batches: {
          [firstKey]: {
            facts: [
              {
                id: 'fact-saved',
                category: 'general',
                field: 'name',
                label: 'Nombre',
                value: 'Contrato guardado',
                confidence: 0.9,
                decision: 'pending',
              },
            ],
            errors: [],
            model: 'llama3.1',
            completedAt: new Date().toISOString(),
          },
        },
        savedAt: new Date().toISOString(),
      },
    };
    const execute = jest.fn().mockResolvedValue({ affected: 1 });
    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute,
    };
    const runs = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn().mockResolvedValue(run),
      save: jest.fn().mockImplementation(async (value: unknown) => value),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const { service } = createService();
    Reflect.set(service, 'runs', runs);
    Reflect.set(service, 'versions', {
      findOne: jest.fn().mockResolvedValue({
        id: 'version-1',
        contractId: 'contract-1',
        fileKey: 'contract.pdf',
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
      }),
    });
    Reflect.set(service, 'storage', { read: jest.fn().mockResolvedValue(buffer) });
    Reflect.set(service, 'textIndexes', {
      find: jest.fn().mockResolvedValue([
        { content: 'Primer lote', pageNumber: 1, chunkIndex: 0 },
        { content: 'Segundo lote', pageNumber: 2, chunkIndex: 1 },
      ]),
    });
    Reflect.set(service, 'replaceTextIndex', jest.fn().mockResolvedValue(undefined));
    Reflect.set(
      service,
      'buildFactExtractionBatches',
      jest.fn().mockReturnValue([firstEvidence, secondEvidence])
    );
    const extractPending = jest.fn().mockResolvedValue({
      facts: [
        {
          id: 'fact-new',
          category: 'dates',
          field: 'endDate',
          label: 'Vencimiento',
          value: '2027-12-31',
          confidence: 0.9,
          decision: 'pending',
        },
      ],
      errors: [],
      model: 'llama3.1',
    });
    Reflect.set(service, 'extractFactsResiliently', extractPending);
    Reflect.set(service, 'extractDeterministicSpecialFacts', jest.fn().mockReturnValue([]));

    await Reflect.get(service, 'process').call(service, run.id);

    expect(extractPending).toHaveBeenCalledTimes(1);
    expect(extractPending).toHaveBeenCalledWith(secondEvidence);
    expect(run.status).toBe('draft_ready');
    expect(run.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'fact-saved' }),
        expect.objectContaining({ id: 'fact-new' }),
      ])
    );
  });

  it('conserva el punto de guardado al reintentar la misma versión del pipeline', async () => {
    const checkpoint = {
      contentHash: 'contract-v7-clean-pdf-checkpoints:hash',
      stage: 'extracting_facts' as const,
      totalBatches: 4,
      batches: {},
      savedAt: new Date().toISOString(),
    };
    const { service, run } = createService({
      status: 'failed',
      progressPercent: 72,
      processingStage: 'failed',
      pipelineVersion: 'contract-v7-clean-pdf-checkpoints',
      contentHash: checkpoint.contentHash,
      checkpoint,
    });
    Reflect.set(service, 'process', jest.fn().mockResolvedValue(undefined));

    const result = await service.retry('contract-1', 'version-1', 'user-1');

    expect((run as Record<string, unknown>).checkpoint).toBe(checkpoint);
    expect((run as Record<string, unknown>).progressPercent).toBe(72);
    expect((run as Record<string, unknown>).processingStage).toBe('resuming');
    expect(result.checkpoint).toEqual(
      expect.objectContaining({ completedBatches: 0, totalBatches: 4 })
    );
  });

  it('descarta el texto indexado cuando cambia el extractor del pipeline', async () => {
    const previousHash = `contract-v4-resilient-batches:${'a'.repeat(64)}`;
    const { service, run } = createService({
      status: 'failed',
      progressPercent: 77,
      processingStage: 'failed',
      pipelineVersion: 'contract-v4-resilient-batches',
      contentHash: previousHash,
      facts: [{ id: 'legacy-fact' }],
    });
    Reflect.set(service, 'process', jest.fn().mockResolvedValue(undefined));

    await service.retry('contract-1', 'version-1', 'user-1');

    expect((run as Record<string, unknown>).contentHash).toBeUndefined();
    expect((run as Record<string, unknown>).progressPercent).toBe(0);
    expect((run as Record<string, unknown>).processingStage).toBe('queued');
    expect(run.facts).toEqual([]);
  });

  it('conserva fragmentos indexados y guarda inmediatamente sólo los faltantes', async () => {
    const { service } = createService();
    const firstContent = 'Primer fragmento ya guardado';
    const secondContent = 'Segundo fragmento pendiente';
    const save = jest.fn().mockImplementation(async (value: unknown) => value);
    const remove = jest.fn().mockResolvedValue({ affected: 0 });
    Reflect.set(service, 'textIndexes', {
      find: jest.fn().mockResolvedValue([
        {
          chunkIndex: 0,
          content: firstContent,
          contentHash: createHash('sha256').update(firstContent).digest('hex'),
        },
      ]),
      delete: remove,
      create: jest.fn().mockImplementation((value: unknown) => value),
      save,
    });
    const createPersistentEmbeddings = jest.fn().mockResolvedValue({
      local: [1, 0],
      ollama: [0, 1],
      ollamaModel: 'nomic-embed-text',
    });
    Reflect.set(service, 'indexing', { createPersistentEmbeddings });
    const onProgress = jest.fn().mockResolvedValue(undefined);

    await Reflect.get(service, 'replaceTextIndex').call(
      service,
      'contract-1',
      { versionId: 'version-1' },
      [{ content: firstContent }, { content: secondContent }],
      onProgress,
      true
    );

    expect(remove).not.toHaveBeenCalled();
    expect(createPersistentEmbeddings).toHaveBeenCalledTimes(1);
    expect(createPersistentEmbeddings).toHaveBeenCalledWith(secondContent);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ chunkIndex: 1 }));
    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
  });

  it('elimina fragmentos viejos que ya no corresponden al texto recuperado', async () => {
    const { service } = createService();
    const remove = jest.fn().mockResolvedValue({ affected: 1 });
    const save = jest.fn().mockImplementation(async (value: unknown) => value);
    Reflect.set(service, 'textIndexes', {
      find: jest.fn().mockResolvedValue([
        {
          id: 'stale-row',
          chunkIndex: 0,
          content: 'Texto ilegible anterior',
          contentHash: createHash('sha256').update('Texto ilegible anterior').digest('hex'),
        },
      ]),
      delete: remove,
      create: jest.fn().mockImplementation((value: unknown) => value),
      save,
    });
    Reflect.set(service, 'indexing', {
      createPersistentEmbeddings: jest.fn().mockResolvedValue({
        local: [1, 0],
        ollama: undefined,
        ollamaModel: 'nomic-embed-text',
      }),
    });

    await Reflect.get(service, 'replaceTextIndex').call(
      service,
      'contract-1',
      { versionId: 'version-1' },
      [{ content: 'Contrato correctamente recuperado' }],
      undefined,
      true
    );

    expect(remove).toHaveBeenCalledWith(['stale-row']);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Contrato correctamente recuperado', chunkIndex: 0 })
    );
  });

  it('corta cláusulas en una sola línea y reconoce listas restauradas sin numerales', () => {
    const { service } = createService();
    const extract = Reflect.get(service, 'extractDeterministicSpecialFacts').bind(service) as (
      chunks: Array<{ content: string; pageNumber?: number }>
    ) => Array<{ category: string; value: Record<string, unknown>; evidence?: string }>;

    const facts = extract([
      {
        pageNumber: 2,
        content: [
          'SEGUNDA ENTREGABLES',
          'El contratista deberá entregar:',
          'Área administrativa terminada.',
          'Instalación eléctrica funcional.',
          'Acabados interiores concluidos.',
          'Reporte fotográfico final.',
          'Acta de entrega física de la obra.',
          'TERCERA. PLAZO DE EJECUCIÓN',
          'La obra tendrá una duración de 60 días naturales.',
          'La fecha estimada de terminación será el 3 de septiembre de 2026.',
          'CUARTA. MONTO DEL CONTRATO',
          'El monto total será de $2,500,000.00 MXN.',
          'El pago se realizará de la siguiente manera:',
          '30% de anticipo.',
          '40% contra avance físico del 50%.',
          '20% contra terminación de los trabajos.',
          '10% contra firma del acta de entrega.',
          'QUINTA. RESPONSABILIDADES DEL CONTRATISTA',
          'El contratista será responsable de:',
          'Proporcionar la mano de obra necesaria.',
          'Mantener limpia y segura el área de trabajo.',
          'SEXTA. RESPONSABILIDADES DEL CLIENTE',
          'El cliente será responsable de:',
          'Proporcionar acceso al inmueble.',
          'Realizar los pagos acordados.',
        ].join('\n'),
      },
      {
        pageNumber: 3,
        content:
          'NOVENA. PENALIZACIONES En caso de retraso atribuible a EL CONTRATISTA, se aplicará una penalización equivalente al 0.5% del monto total del contrato por cada día de retraso, con un límite máximo del 10%.\nDÉCIMA. GARANTÍA EL CONTRATISTA garantiza los trabajos por un período de 6 meses contados a partir de la fecha de entrega.\nDÉCIMA PRIMERA. TERMINACIÓN ANTICIPADA Cualquiera de las partes podrá solicitarla.',
      },
    ]);

    expect(facts.filter((fact) => fact.category === 'deliverables')).toHaveLength(5);
    expect(facts.filter((fact) => fact.category === 'payments')).toHaveLength(4);
    expect(facts.filter((fact) => fact.category === 'obligations')).toHaveLength(4);
    expect(facts.filter((fact) => fact.category === 'milestones')).toHaveLength(1);
    expect(facts.find((fact) => fact.category === 'penalties')?.value).toEqual(
      expect.objectContaining({ percentage: 0.5, capPercentage: 10 })
    );
    expect(facts.find((fact) => fact.category === 'penalties')?.evidence).not.toContain('GARANTÍA');
    expect(facts.find((fact) => fact.category === 'guarantees')?.value).toEqual(
      expect.objectContaining({ durationMonths: 6 })
    );
    expect(facts.find((fact) => fact.category === 'guarantees')?.evidence).not.toContain(
      'TERMINACIÓN ANTICIPADA'
    );
  });

  it('distribuye cada categoría aprobada en su módulo conservando todos sus campos', () => {
    const { service } = createService();
    const build = Reflect.get(service, 'buildPersistencePayloads').bind(service) as (
      facts: Array<Record<string, unknown>>,
      context: Record<string, unknown>
    ) => {
      obligations: Array<Record<string, unknown>>;
      milestones: Array<Record<string, unknown>>;
      payments: Array<Record<string, unknown>>;
      deliverables: Array<Record<string, unknown>>;
      records: Array<Record<string, unknown>>;
    };
    const fact = (
      category: string,
      value: Record<string, unknown>,
      evidence = 'Cláusula comprobada.'
    ) => ({
      id: `${category}-1`,
      category,
      field: category.slice(0, -1),
      label: category,
      value,
      confidence: 1,
      evidence,
      pageNumber: 2,
      decision: 'accepted',
    });
    const payloads = build(
      [
        fact('obligations', {
          description: 'Entregar reporte.',
          commitmentDate: '2026-09-03',
          comments: 'Responsable: EL CONTRATISTA',
          periodicity: 'monthly',
          priority: 'high',
          consequence: 'Aplicación de pena.',
          alertDaysBefore: 10,
        }),
        fact('milestones', {
          name: 'Terminación de obra',
          milestoneDate: '2026-09-03',
          notes: 'Validar con acta.',
          alertDaysBefore: 7,
        }),
        fact('payments', {
          concept: 'Anticipo',
          amount: '250000.00',
          currency: 'MXN',
          percentage: 30,
          condition: 'Contra firma',
          paymentDate: '2026-07-06',
          dueDate: '2026-07-10',
          notes: 'Requiere factura.',
        }),
        fact('deliverables', {
          name: 'Reporte final',
          description: 'Reporte fotográfico.',
          dueDate: '2026-09-03',
          acceptanceCriteria: 'Firmado por el cliente.',
        }),
        fact('penalties', {
          title: 'Pena por retraso',
          description: 'Aplica por retraso.',
          percentage: 0.5,
          capPercentage: 10,
          trigger: 'retraso atribuible',
          frequency: 'día de retraso',
          basisClause: 'NOVENA. PENALIZACIONES',
          calculation: '0.5% por día',
          amount: 12500,
          currency: 'MXN',
          dueDate: '2026-09-10',
        }),
        fact('guarantees', {
          title: 'Garantía de los trabajos',
          description: 'Cubre los trabajos.',
          issuer: 'EL CONTRATISTA',
          beneficiary: 'EL CLIENTE',
          durationMonths: 6,
          startCondition: 'firma del acta de entrega',
          coverage: 'los trabajos',
          validFrom: '2026-09-03',
          validUntil: '2027-03-03',
          basisClause: 'DÉCIMA. GARANTÍA',
        }),
        fact('risks', {
          description: 'Riesgo de retraso por falta de acceso.',
          severity: 'high',
          recommendation: 'Confirmar accesos antes del inicio.',
        }),
      ],
      {
        contractId: 'contract-1',
        userId: 'user-1',
        currency: 'MXN',
        extractionRunId: '12345678-run',
        versionId: 'version-1',
      }
    );

    expect(payloads.obligations).toEqual([
      expect.objectContaining({
        contractId: 'contract-1',
        description: 'Entregar reporte.',
        commitmentDate: '2026-09-03',
        periodicity: 'monthly',
        priority: 'high',
        consequence: 'Aplicación de pena.',
        alertDaysBefore: 10,
        status: 'pending',
      }),
    ]);
    expect(payloads.milestones).toEqual([
      expect.objectContaining({
        name: 'Terminación de obra',
        milestoneDate: '2026-09-03',
        notes: 'Validar con acta.',
      }),
    ]);
    expect(payloads.payments).toEqual([
      expect.objectContaining({
        concept: 'Anticipo',
        amount: '250000.00',
        percentage: '30.0000',
        paymentCondition: 'Contra firma',
        paymentDate: '2026-07-06',
        dueDate: '2026-07-10',
      }),
    ]);
    expect(payloads.deliverables).toEqual([
      expect.objectContaining({
        name: 'Reporte final',
        description: 'Reporte fotográfico.',
        dueDate: '2026-09-03',
        acceptanceCriteria: 'Firmado por el cliente.',
        status: 'pending',
      }),
    ]);
    expect(payloads.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordType: 'penalty',
          title: 'Pena por retraso',
          amount: '12500.00',
          percentage: '0.5000',
          basisClause: 'NOVENA. PENALIZACIONES',
          calculation: '0.5% por día',
          metadata: expect.objectContaining({
            capPercentage: 10,
            trigger: 'retraso atribuible',
            frequency: 'día de retraso',
          }),
        }),
        expect.objectContaining({
          recordType: 'guarantee',
          title: 'Garantía de los trabajos',
          issuer: 'EL CONTRATISTA',
          beneficiary: 'EL CLIENTE',
          validFrom: '2026-09-03',
          validUntil: '2027-03-03',
          metadata: expect.objectContaining({
            durationMonths: 6,
            startCondition: 'firma del acta de entrega',
            coverage: 'los trabajos',
          }),
        }),
        expect.objectContaining({
          recordType: 'risk',
          description: 'Riesgo de retraso por falta de acceso.',
          metadata: expect.objectContaining({
            severity: 'high',
            recommendation: 'Confirmar accesos antes del inicio.',
          }),
        }),
      ])
    );
  });

  it('descarta valores ajenos a la cláusula citada', () => {
    const { service } = createService();
    const parseFacts = Reflect.get(service, 'parseFacts').bind(service) as (
      content: string,
      evidence: string
    ) => Array<{ value: Record<string, unknown> }>;
    const clause =
      'EL CONTRATISTA garantiza los trabajos por un periodo de 6 meses contados a partir de la firma del acta de entrega.';
    const [fact] = parseFacts(
      JSON.stringify({
        facts: [
          {
            category: 'guarantees',
            field: 'guarantee',
            label: 'Garantía',
            value: {
              amount: '$250,000.00',
              currency: 'MXN',
              validFrom: '6 meses después de la fecha de entrega',
              description: 'admin@holocron.local',
            },
            confidence: 1,
            evidence: clause,
          },
        ],
      }),
      `[Página 3]\n${clause}`
    );

    expect(fact.value).toEqual(
      expect.objectContaining({
        durationMonths: 6,
        amount: undefined,
        currency: undefined,
        validFrom: undefined,
        description: 'Cubre los trabajos.',
      })
    );
    expect(JSON.stringify(fact.value)).not.toContain('admin@holocron.local');
  });

  it('hace consultable el anexo antes de que Ollama termine de normalizarlo', async () => {
    const { service } = createService();
    const replaceTextIndex = jest.fn().mockResolvedValue(undefined);
    Reflect.set(service, 'storage', { read: jest.fn().mockResolvedValue(Buffer.from('anexo')) });
    Reflect.set(service, 'indexing', {
      extractFile: jest.fn().mockResolvedValue({
        segments: [{ text: 'Contenido contractual del anexo.', pageNumber: 1 }],
      }),
    });
    Reflect.set(service, 'ollama', {
      normalizeContractTranscription: jest.fn().mockReturnValue(new Promise(() => undefined)),
    });
    Reflect.set(service, 'replaceTextIndex', replaceTextIndex);

    await service.indexAttachment({
      id: 'attachment-1',
      contractId: 'contract-1',
      fileKey: 'attachments/anexo.pdf',
      fileName: 'anexo.pdf',
      mimeType: 'application/pdf',
    } as never);

    expect(replaceTextIndex).toHaveBeenCalledWith(
      'contract-1',
      { attachmentId: 'attachment-1' },
      expect.arrayContaining([
        expect.objectContaining({
          content: 'Contenido contractual del anexo.',
          normalizationMethod: 'deterministic',
        }),
      ])
    );
  });

  it('solo permite que la persona que cargó la versión revise el borrador', async () => {
    const { service } = createService();

    await expect(
      service.updateDraft('contract-1', 'version-1', 'another-user', [])
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza la aprobación cuando la contraseña actual es incorrecta', async () => {
    const { service } = createService();
    Reflect.set(service, 'users', {
      findByIdWithRoles: jest.fn().mockResolvedValue({
        id: 'user-1',
        active: true,
        passwordHash: await bcrypt.hash('correct-password', 4),
      }),
    });

    await expect(
      service.approve('contract-1', 'version-1', 'user-1', 'wrong-password', [])
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('consulta datos aprobados e indice local sin volver a procesar el archivo', async () => {
    const { service } = createService({
      status: 'approved',
      facts: [
        {
          id: 'fact-1',
          category: 'dates',
          field: 'endDate',
          label: 'Fecha de vencimiento',
          value: '2027-12-31',
          confidence: 0.98,
          decision: 'accepted',
        },
      ],
    });
    const localEmbedding = jest.fn().mockReturnValue([1, 0]);
    Reflect.set(service, 'indexing', { createLocalEmbedding: localEmbedding });
    Reflect.set(service, 'textIndexes', {
      find: jest.fn().mockResolvedValue([
        {
          content: 'El contrato termina el 31 de diciembre de 2027.',
          embedding: [1, 0],
          pageNumber: 3,
          chunkIndex: 0,
        },
      ]),
    });
    Reflect.set(service, 'ollama', {
      answer: jest.fn().mockResolvedValue({ answer: 'Vence el 31 de diciembre de 2027.' }),
      expandBilingualQuery: jest
        .fn()
        .mockResolvedValue({ spanish: '¿Cuándo vence?', english: 'When does it expire?' }),
    });

    const result = await service.ask(
      { id: 'contract-1', name: 'Contrato demo' } as never,
      { id: 'version-1', versionLabel: '1.0' } as never,
      '¿Cuándo vence?'
    );

    expect(result?.answer).toContain('31 de diciembre de 2027');
    expect(result?.citations[0].sourceType).toBe('approved_contract_fact');
    expect(result?.context).toEqual(
      expect.objectContaining({ mode: 'persisted_contract_knowledge', fileRead: false })
    );
    expect(localEmbedding).toHaveBeenCalled();
    expect(Reflect.get(service, 'storage')).toBeUndefined();
  });

  it('convierte objetos aprobados a texto legible para Ollama sin campos vacios', async () => {
    const { service } = createService({
      status: 'approved',
      facts: [
        {
          id: 'fact-payment',
          category: 'payments',
          field: 'payment',
          label: 'Concepto del pago',
          value: {
            amount: null,
            concept: '30% de anticipo',
            dueDate: null,
            currency: null,
          },
          confidence: 0.95,
          decision: 'accepted',
        },
      ],
    });
    Reflect.set(service, 'indexing', { createLocalEmbedding: jest.fn().mockReturnValue([1, 0]) });
    Reflect.set(service, 'textIndexes', { find: jest.fn().mockResolvedValue([]) });
    const answer = jest.fn().mockResolvedValue({ answer: 'El anticipo es de 30%.' });
    Reflect.set(service, 'ollama', {
      answer,
      expandBilingualQuery: jest.fn().mockResolvedValue({
        spanish: '¿Cuál es el anticipo?',
        english: 'What is the advance payment?',
      }),
    });

    await service.ask(
      { id: 'contract-1', name: 'Contrato demo' } as never,
      { id: 'version-1', versionLabel: '1.0' } as never,
      '¿Cuál es el anticipo?'
    );

    const evidence = answer.mock.calls[0][1] as Array<{ fragment: string }>;
    expect(evidence[0].fragment).toContain('Concepto: 30% de anticipo');
    expect(evidence[0].fragment).not.toContain('null');
    expect(evidence[0].fragment).not.toContain('{');
  });

  it('encuentra evidencia en ingles cuando la pregunta esta en espanol', async () => {
    const { service } = createService({ status: 'approved', facts: [] });
    Reflect.set(service, 'indexing', { createLocalEmbedding: jest.fn().mockReturnValue([0]) });
    Reflect.set(service, 'textIndexes', {
      find: jest.fn().mockResolvedValue([
        {
          content: 'The completion date is September 18, 2026.',
          embedding: [0],
          pageNumber: 2,
          chunkIndex: 0,
        },
        ...Array.from({ length: 6 }, (_, index) => ({
          content: `General administrative provision ${index + 1}.`,
          embedding: [0],
          pageNumber: 1,
          chunkIndex: index + 1,
        })),
      ]),
    });
    const answer = jest.fn().mockResolvedValue({
      answer: 'El contrato termina el 18 de septiembre de 2026.',
    });
    Reflect.set(service, 'ollama', {
      answer,
      expandBilingualQuery: jest.fn().mockResolvedValue({
        spanish: '¿Cuál es la fecha de terminación?',
        english: 'What is the completion date?',
      }),
    });

    const result = await service.ask(
      { id: 'contract-1', name: 'Contrato bilingüe' } as never,
      { id: 'version-1', versionLabel: '1.0' } as never,
      '¿Cuál es la fecha de terminación?'
    );

    expect(result?.citations[0].fragment).toContain('completion date');
    expect(result?.context.searchLanguages).toEqual(['es', 'en']);
  });

  it('consulta la transcripcion de un anexo como documento contractual independiente', async () => {
    const { service } = createService();
    Reflect.set(service, 'indexing', { createLocalEmbedding: jest.fn().mockReturnValue([0]) });
    Reflect.set(service, 'textIndexes', {
      find: jest.fn().mockResolvedValue([
        {
          content: 'El anexo establece una garantía de doce meses.',
          embedding: [0],
          pageNumber: 4,
          chunkIndex: 0,
        },
      ]),
    });
    Reflect.set(service, 'ollama', {
      expandBilingualQuery: jest.fn().mockResolvedValue({
        spanish: '¿Qué garantía tiene el anexo?',
        english: 'What warranty does the annex provide?',
      }),
      answer: jest.fn().mockResolvedValue({ answer: 'La garantía es de doce meses.' }),
    });

    const result = await service.askAcross(
      [
        {
          sourceType: 'attachment',
          contract: { id: 'contract-1', name: 'Contrato demo' } as never,
          attachment: {
            id: 'attachment-1',
            contractId: 'contract-1',
            name: 'Anexo técnico',
          } as never,
        },
      ],
      '¿Qué garantía tiene el anexo?'
    );

    expect(result.answer).toContain('doce meses');
    expect(result.citations[0].sourceType).toBe('contract_attachment_transcription');
    expect(result.citations[0].label).toContain('Anexo técnico');
  });

  it('elimina secuencias numericas residuales al final de la transcripcion', () => {
    const { service } = createService();
    const clean = Reflect.get(service, 'cleanTranscriptionArtifacts').bind(service) as (
      value: string
    ) => string;

    expect(
      clean(
        'El pago final sera contra terminacion de los trabajos. 1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 11.'
      )
    ).toBe('El pago final sera contra terminacion de los trabajos.');
  });

  it('reconstruye una pagina sin repetir el solapamiento de sus fragmentos', () => {
    const { service } = createService();
    const merge = Reflect.get(service, 'mergeChunkContents').bind(service) as (
      values: string[]
    ) => string;
    const overlap = 'texto compartido entre ambos fragmentos para conservar el contexto';

    expect(merge([`Inicio de la clausula ${overlap}`, `${overlap} y final.`])).toBe(
      `Inicio de la clausula ${overlap} y final.`
    );
  });
});
