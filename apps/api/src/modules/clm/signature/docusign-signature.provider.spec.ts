import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { DocuSignSignatureProvider } from './docusign-signature.provider';

function config(values: Record<string, string>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('DocuSignSignatureProvider', () => {
  it('sólo se declara configurado cuando también existe el secreto del webhook', () => {
    const incomplete = new DocuSignSignatureProvider(
      config({
        DOCUSIGN_ACCOUNT_ID: 'account',
        DOCUSIGN_CLIENT_ID: 'client',
        DOCUSIGN_PRIVATE_KEY: 'key',
        DOCUSIGN_USER_ID: 'user',
      })
    );
    const complete = new DocuSignSignatureProvider(
      config({
        DOCUSIGN_ACCOUNT_ID: 'account',
        DOCUSIGN_CLIENT_ID: 'client',
        DOCUSIGN_PRIVATE_KEY: 'key',
        DOCUSIGN_USER_ID: 'user',
        DOCUSIGN_WEBHOOK_HMAC_SECRET: 'webhook-secret',
      })
    );

    expect(incomplete.configured).toBe(false);
    expect(complete.configured).toBe(true);
  });

  it('valida la firma HMAC contra el cuerpo crudo recibido', () => {
    const provider = new DocuSignSignatureProvider(
      config({
        DOCUSIGN_ACCOUNT_ID: 'account',
        DOCUSIGN_CLIENT_ID: 'client',
        DOCUSIGN_PRIVATE_KEY: 'key',
        DOCUSIGN_USER_ID: 'user',
        DOCUSIGN_WEBHOOK_HMAC_SECRET: 'webhook-secret',
      })
    );
    const body = Buffer.from('{"event":"envelope-completed"}');
    const signature = createHmac('sha256', 'webhook-secret').update(body).digest('base64');

    expect(provider.verifyWebhook(body, signature)).toBe(true);
    expect(provider.verifyWebhook(Buffer.from('{}'), signature)).toBe(false);
  });

  it('normaliza el payload anidado de DocuSign Connect', async () => {
    const provider = new DocuSignSignatureProvider(config({}));

    await expect(
      provider.handleWebhook({
        data: {
          envelopeSummary: {
            envelopeId: 'envelope-1',
            status: 'completed',
            completedDateTime: '2026-07-21T10:00:00Z',
          },
        },
      })
    ).resolves.toEqual({
      envelopeId: 'envelope-1',
      status: 'completed',
      signedAt: new Date('2026-07-21T10:00:00Z'),
    });
  });
});
