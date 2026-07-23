import { ServiceUnavailableException } from '@nestjs/common';
import {
  SignatureProvider,
  SignatureSendRequest,
  SignatureSendResponse,
  SignatureStatusResponse,
} from './signature-provider.interface';

export class DisabledSignatureProvider implements SignatureProvider {
  readonly name = 'disabled';
  readonly configured = false;

  send(_request: SignatureSendRequest): Promise<SignatureSendResponse> {
    throw new ServiceUnavailableException('La integración de firma no está configurada');
  }

  checkStatus(providerRequestId: string): Promise<SignatureStatusResponse> {
    return Promise.resolve({ providerRequestId, status: 'not_configured', signers: [] });
  }

  cancel(_providerRequestId: string): Promise<void> {
    return Promise.resolve();
  }
}
