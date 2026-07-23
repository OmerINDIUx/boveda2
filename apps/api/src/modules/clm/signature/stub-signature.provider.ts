import { Injectable } from '@nestjs/common';
import {
  SignatureProvider,
  SignatureSendRequest,
  SignatureSendResponse,
  SignatureStatusResponse,
} from './signature-provider.interface';

@Injectable()
export class StubSignatureProvider implements SignatureProvider {
  readonly name = 'stub';
  readonly configured = true;

  private requests = new Map<
    string,
    {
      status: string;
      signedAt?: Date;
      signers: Array<{ name: string; email: string; signedAt?: Date }>;
    }
  >();

  async send(request: SignatureSendRequest): Promise<SignatureSendResponse> {
    const providerRequestId = `stub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.requests.set(providerRequestId, {
      status: 'sent',
      signers: request.signers.map((s) => ({ ...s })),
    });
    return {
      providerRequestId,
      status: 'sent',
      signingUrl: `https://stub-signature.local/sign/${providerRequestId}`,
    };
  }

  async checkStatus(providerRequestId: string): Promise<SignatureStatusResponse> {
    const record = this.requests.get(providerRequestId);
    if (!record) {
      return { providerRequestId, status: 'not_found', signers: [] };
    }
    return {
      providerRequestId,
      status: record.status,
      signedAt: record.signedAt,
      signers: record.signers,
    };
  }

  async cancel(providerRequestId: string): Promise<void> {
    this.requests.delete(providerRequestId);
  }
}
