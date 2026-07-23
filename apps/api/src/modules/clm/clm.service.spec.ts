import { createHash } from 'crypto';
import { ClmService } from './clm.service';

type MockRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function repository(initial: unknown[] = []): MockRepository {
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  return {
    find: jest.fn().mockResolvedValue(initial),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (value: unknown) => value),
    create: jest.fn().mockImplementation((value: unknown) => value),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  };
}

function setDependency(service: ClmService, name: string, value: unknown) {
  Reflect.set(service, name, value);
}

function createService() {
  const service = Object.create(ClmService.prototype) as ClmService;
  const repositories = {
    contracts: repository(),
    versions: repository(),
    attachments: repository(),
    obligations: repository(),
    milestones: repository(),
    deliverables: repository(),
    comments: repository(),
    auditLogs: repository(),
    amendmentsRepo: repository(),
    paymentsRepo: repository(),
    signaturesRepo: repository(),
    negotiationsRepo: repository(),
    customValuesRepo: repository(),
    lifecycleEventsRepo: repository(),
    tagsRepo: repository(),
  };

  Object.entries(repositories).forEach(([name, value]) => setDependency(service, name, value));
  setDependency(service, 'storage', { read: jest.fn() });
  setDependency(service, 'contractExtraction', {
    indexAttachment: jest.fn().mockResolvedValue(undefined),
    createAttachmentAndStart: jest.fn().mockResolvedValue({ id: 'extraction-run-1' }),
  });
  setDependency(service, 'logger', { error: jest.fn() });
  setDependency(service, 'signatureProvider', {
    name: 'stub',
    configured: true,
    send: jest.fn(),
    checkStatus: jest.fn(),
    cancel: jest.fn(),
    handleWebhook: jest.fn(),
  });
  setDependency(service, 'erpIntegration', {
    name: 'stub',
    configured: true,
    syncInvoice: jest.fn(),
    syncPayment: jest.fn(),
    testConnection: jest.fn(),
  });
  setDependency(
    service,
    'assertContractAccess',
    jest.fn().mockResolvedValue({
      id: 'contract-1',
      name: 'Contrato principal',
      currentVersionId: null,
    })
  );
  setDependency(service, 'toListItem', jest.fn().mockResolvedValue({ id: 'contract-1' }));
  setDependency(service, 'log', jest.fn().mockResolvedValue(undefined));

  return { service, repositories };
}

describe('ClmService', () => {
  it('registra como versión el archivo cargado por fragmentos e inicia la extracción', async () => {
    const { service, repositories } = createService();
    const storage = { read: jest.fn().mockResolvedValue(Buffer.from('contrato original')) };
    const contractExtraction = {
      createAndStart: jest.fn().mockResolvedValue({ id: 'extraction-run-1', status: 'processing' }),
    };
    repositories.versions.save.mockImplementationOnce(async (value: unknown) => ({
      ...(value as object),
      id: 'version-1',
    }));
    setDependency(service, 'storage', storage);
    setDependency(service, 'contractExtraction', contractExtraction);
    setDependency(
      service,
      'getDetail',
      jest.fn().mockResolvedValue({ id: 'contract-1', versions: [] })
    );

    const result = await service.createVersion('user-1', 'contract-1', {
      versionLabel: 'Original',
      fileKey: 'uploads/contract-original.pdf',
      fileName: 'contrato-original.pdf',
      mimeType: 'application/pdf',
      changeSummary: 'Contrato original',
    });

    expect(storage.read).toHaveBeenCalledWith('uploads/contract-original.pdf');
    expect(repositories.versions.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: 'contract-1',
        fileKey: 'uploads/contract-original.pdf',
        sizeBytes: Buffer.byteLength('contrato original'),
      })
    );
    expect(repositories.contracts.save).toHaveBeenCalledWith(
      expect.objectContaining({ currentVersionId: 'version-1', status: 'in_review' })
    );
    expect(contractExtraction.createAndStart).toHaveBeenCalledWith(
      'contract-1',
      'version-1',
      'user-1'
    );
    expect(result).toEqual(
      expect.objectContaining({
        createdVersionId: 'version-1',
        extractionRunId: 'extraction-run-1',
        extractionStatus: 'processing',
      })
    );
  });

  it('devuelve el detalle parcial y señala únicamente la sección que falló', async () => {
    const { service, repositories } = createService();
    repositories.versions.find.mockRejectedValueOnce(new Error('database unavailable'));
    repositories.attachments.find.mockResolvedValueOnce([{ id: 'attachment-1' }]);

    const result = await service.getDetail('user-1', 'contract-1', false);

    expect(result.isPartial).toBe(true);
    expect(result.versions).toEqual([]);
    expect(result.attachments).toEqual([{ id: 'attachment-1' }]);
    expect(result.sectionErrors).toEqual({
      versions: 'No se pudo cargar esta sección. Puedes reintentar sin perder el resto.',
    });
  });

  it('reutiliza una solicitud de firma equivalente y evita duplicarla', async () => {
    const { service, repositories } = createService();
    const file = Buffer.from('contrato para firmar');
    const documentHash = createHash('sha256').update(file).digest('hex');
    const existing = {
      id: 'signature-1',
      signersJson: [{ name: 'Ana', email: 'ana@example.com', order: 1 }],
    };
    repositories.versions.findOne.mockResolvedValueOnce({
      id: 'version-1',
      fileKey: 'contracts/version-1.pdf',
      fileName: 'contrato.pdf',
    });
    repositories.signaturesRepo.find.mockResolvedValueOnce([existing]);
    const storage = { read: jest.fn().mockResolvedValue(file) };
    const signatureProvider = {
      name: 'stub',
      configured: true,
      send: jest.fn(),
      checkStatus: jest.fn(),
      cancel: jest.fn(),
      handleWebhook: jest.fn(),
    };
    setDependency(service, 'storage', storage);
    setDependency(service, 'signatureProvider', signatureProvider);

    const result = await service.sendForSignature('user-1', 'contract-1', {
      versionId: 'version-1',
      signers: [{ name: ' Ana ', email: 'ANA@EXAMPLE.COM' }],
    });

    expect(result).toEqual({ signature: existing, reused: true });
    expect(signatureProvider.send).not.toHaveBeenCalled();
    expect(repositories.signaturesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ documentHash }),
      })
    );
  });

  it('envía a firma el anexo seleccionado y conserva su referencia', async () => {
    const { service, repositories } = createService();
    const file = Buffer.from('anexo para firmar');
    repositories.attachments.findOne.mockResolvedValueOnce({
      id: 'attachment-1',
      contractId: 'contract-1',
      fileKey: 'contracts/attachment-1.pdf',
      fileName: 'anexo-tecnico.pdf',
    });
    repositories.signaturesRepo.find.mockResolvedValueOnce([]);
    const storage = { read: jest.fn().mockResolvedValue(file) };
    const signatureProvider = {
      name: 'stub',
      configured: true,
      send: jest.fn().mockResolvedValue({
        providerRequestId: 'provider-request-1',
        status: 'sent',
      }),
      checkStatus: jest.fn(),
      cancel: jest.fn(),
      handleWebhook: jest.fn(),
    };
    setDependency(service, 'storage', storage);
    setDependency(service, 'signatureProvider', signatureProvider);

    await service.sendForSignature('user-1', 'contract-1', {
      attachmentId: 'attachment-1',
      signers: [{ name: 'Ana', email: 'ana@example.com' }],
    });

    expect(repositories.versions.findOne).not.toHaveBeenCalled();
    expect(storage.read).toHaveBeenCalledWith('contracts/attachment-1.pdf');
    expect(signatureProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: 'contract-1',
        versionId: undefined,
        fileName: 'anexo-tecnico.pdf',
      })
    );
    expect(repositories.signaturesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: 'contract-1',
        versionId: undefined,
        attachmentId: 'attachment-1',
      })
    );
  });

  it('entrega archivos de versiones y anexos después de validar acceso al contrato', async () => {
    const { service, repositories } = createService();
    const versionBuffer = Buffer.from('version');
    const attachmentBuffer = Buffer.from('attachment');
    repositories.versions.findOne.mockResolvedValueOnce({
      id: 'version-1',
      contractId: 'contract-1',
      fileKey: 'version.pdf',
      fileName: 'version.pdf',
      mimeType: 'application/pdf',
    });
    repositories.attachments.findOne.mockResolvedValueOnce({
      id: 'attachment-1',
      contractId: 'contract-1',
      fileKey: 'annex.xlsx',
      fileName: 'annex.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const storage = {
      read: jest.fn().mockResolvedValueOnce(versionBuffer).mockResolvedValueOnce(attachmentBuffer),
    };
    setDependency(service, 'storage', storage);

    await expect(service.getVersionFile('user-1', 'contract-1', 'version-1')).resolves.toEqual({
      buffer: versionBuffer,
      fileName: 'version.pdf',
      mimeType: 'application/pdf',
    });
    await expect(
      service.getAttachmentFile('user-1', 'contract-1', 'attachment-1')
    ).resolves.toEqual({
      buffer: attachmentBuffer,
      fileName: 'annex.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  });

  it('agrega una versión al mismo anexo y la establece como vigente', async () => {
    const { service, repositories } = createService();
    repositories.attachments.findOne.mockResolvedValueOnce({
      id: 'attachment-v1',
      contractId: 'contract-1',
      attachmentGroupId: 'attachment-group-1',
      name: 'Anexo técnico',
    });
    setDependency(
      service,
      'storeBase64File',
      jest.fn().mockResolvedValue({ fileKey: 'stored/anexo-v2.pdf', sizeBytes: 120 })
    );
    setDependency(service, 'getDetail', jest.fn().mockResolvedValue({ id: 'contract-1' }));

    await expect(
      service.addAttachmentVersion('user-1', 'contract-1', 'attachment-v1', {
        versionLabel: '2',
        fileName: 'anexo-v2.pdf',
        mimeType: 'application/pdf',
        base64Content: 'cGRm',
        notes: 'Actualiza especificaciones',
      })
    ).resolves.toEqual({ id: 'contract-1' });

    expect(repositories.attachments.update).toHaveBeenCalledWith(
      { contractId: 'contract-1', attachmentGroupId: 'attachment-group-1' },
      { isCurrent: false }
    );
    expect(repositories.attachments.save).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentGroupId: 'attachment-group-1',
        versionLabel: '2',
        isCurrent: true,
        name: 'Anexo técnico',
      })
    );
  });

  it('actualiza una obligación, normaliza su estado y registra la auditoría', async () => {
    const { service, repositories } = createService();
    const obligation = {
      id: 'obligation-1',
      contractId: 'contract-1',
      description: 'Entregar informe',
      commitmentDate: '2026-08-01',
      status: 'pending',
    };
    repositories.obligations.findOne.mockResolvedValueOnce(obligation);
    setDependency(
      service,
      'assertDocumentBelongsToProject',
      jest.fn().mockResolvedValue(undefined)
    );
    setDependency(service, 'normalizeObligationStatus', jest.fn().mockReturnValue('completed'));
    setDependency(service, 'syncAlerts', jest.fn().mockResolvedValue(undefined));
    setDependency(service, 'getDetail', jest.fn().mockResolvedValue({ id: 'contract-1' }));
    setDependency(
      service,
      'assertContractAccess',
      jest.fn().mockResolvedValue({ id: 'contract-1', projectId: 'project-1' })
    );

    await expect(
      service.updateObligation('user-1', 'contract-1', 'obligation-1', {
        status: 'completed',
        comments: 'Validado',
      })
    ).resolves.toEqual({ id: 'contract-1' });
    expect(obligation.status).toBe('completed');
    expect(repositories.obligations.save).toHaveBeenCalledWith(obligation);
    expect(Reflect.get(service, 'log')).toHaveBeenCalledWith(
      'contract-1',
      'user-1',
      'edit_obligation',
      expect.objectContaining({ status: 'pending' }),
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('sincroniza un pago al ERP con una llave de idempotencia y persiste el estado', async () => {
    const { service, repositories } = createService();
    const payment = {
      id: 'payment-1',
      contractId: 'contract-1',
      concept: 'Mensualidad',
      amount: '1500.00',
      currency: 'MXN',
      paymentDate: '2026-07-20',
      dueDate: null,
      invoiceNumber: null,
      status: 'paid',
      erpSyncStatus: null,
      erpExternalId: null,
      erpSyncError: null,
      erpSyncedAt: null,
      createdAt: new Date('2026-07-20T12:00:00Z'),
    };
    repositories.paymentsRepo.findOne.mockResolvedValueOnce(payment);
    const erpIntegration = {
      name: 'http',
      configured: true,
      syncInvoice: jest.fn(),
      syncPayment: jest.fn().mockResolvedValue({ success: true, externalId: 'erp-99' }),
      testConnection: jest.fn(),
    };
    setDependency(service, 'erpIntegration', erpIntegration);

    const result = await service.syncPaymentToErp('user-1', 'contract-1', 'payment-1');

    expect(result.duplicate).toBe(false);
    expect(erpIntegration.syncPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^clm-payment-payment-1-/),
        amount: '1500.00',
      })
    );
    expect(payment.erpSyncStatus).toBe('synced');
    expect(payment.erpExternalId).toBe('erp-99');
    expect(repositories.paymentsRepo.save).toHaveBeenCalledTimes(2);
  });
});
