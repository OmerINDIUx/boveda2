import { ConfigService } from '@nestjs/config';
import { HttpErpProvider } from './http-erp.provider';

function config(values: Record<string, string>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('HttpErpProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('envía la llave de idempotencia y conserva el identificador externo', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ externalId: 'erp-payment-10' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const provider = new HttpErpProvider(
      config({
        ERP_BASE_URL: 'https://erp.example.test',
        ERP_API_KEY: 'secret',
      })
    );

    const result = await provider.syncPayment({
      idempotencyKey: 'clm-payment-10-hash',
      contractName: 'Contrato 10',
      concept: 'Mensualidad',
      amount: '1000.00',
      currency: 'MXN',
      paidAt: '2026-07-21',
    });

    expect(result).toEqual({ success: true, externalId: 'erp-payment-10' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://erp.example.test/payments',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret',
          'Idempotency-Key': 'clm-payment-10-hash',
        }),
      })
    );
  });

  it('no intenta conectarse cuando faltan credenciales', async () => {
    global.fetch = jest.fn();
    const provider = new HttpErpProvider(config({}));

    await expect(provider.testConnection()).resolves.toEqual({
      connected: false,
      message: 'Faltan ERP_BASE_URL o ERP_API_KEY',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
