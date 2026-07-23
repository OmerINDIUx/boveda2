import { DocumentIndexingService } from './document-indexing.service';

describe('DocumentIndexingService', () => {
  it('prefiere el lector compatible de PDF antes que los extractores heredados', async () => {
    const service = Object.create(DocumentIndexingService.prototype) as DocumentIndexingService;
    const compatibleResult = {
      contentType: 'pdf' as const,
      segments: [{ text: 'Contrato correctamente extraído', pageNumber: 1 }],
    };
    const extractPdfWithPdfplumber = jest.fn().mockResolvedValue(compatibleResult);
    const extractWithPdftotext = jest.fn();
    const extractPdfText = jest.fn();
    Reflect.set(service, 'extractPdfWithPdfplumber', extractPdfWithPdfplumber);
    Reflect.set(service, 'extractWithPdftotext', extractWithPdftotext);
    Reflect.set(service, 'extractPdfText', extractPdfText);

    const result = await service.extractFile('contrato.pdf', 'application/pdf', Buffer.from('pdf'));

    expect(result).toEqual(compatibleResult);
    expect(extractPdfWithPdfplumber).toHaveBeenCalledTimes(1);
    expect(extractWithPdftotext).not.toHaveBeenCalled();
    expect(extractPdfText).not.toHaveBeenCalled();
  });

  it('conserva la extracción heredada como respaldo si el lector compatible no está disponible', async () => {
    const service = Object.create(DocumentIndexingService.prototype) as DocumentIndexingService;
    const fallbackResult = {
      contentType: 'pdf' as const,
      segments: [{ text: 'Texto de respaldo', pageNumber: 1 }],
    };
    Reflect.set(
      service,
      'extractPdfWithPdfplumber',
      jest.fn().mockRejectedValue(new Error('pdfplumber no disponible'))
    );
    const extractWithPdftotext = jest.fn().mockResolvedValue(fallbackResult);
    Reflect.set(service, 'extractWithPdftotext', extractWithPdftotext);
    Reflect.set(service, 'extractPdfText', jest.fn());

    const result = await service.extractFile('contrato.pdf', 'application/pdf', Buffer.from('pdf'));

    expect(result).toEqual(fallbackResult);
    expect(extractWithPdftotext).toHaveBeenCalledTimes(1);
  });
});
