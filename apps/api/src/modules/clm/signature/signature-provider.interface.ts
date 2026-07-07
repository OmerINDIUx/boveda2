export interface Signer {
  name: string;
  email: string;
}

export interface SignatureSendRequest {
  contractId: string;
  versionId?: string;
  documentBase64: string;
  fileName: string;
  signers: Signer[];
  expiresAt?: Date;
}

export interface SignatureSendResponse {
  providerRequestId: string;
  status: string;
  signingUrl?: string;
}

export interface SignatureStatusResponse {
  providerRequestId: string;
  status: string;
  signedAt?: Date;
  signers: Array<{ name: string; email: string; signedAt?: Date }>;
}

export interface SignatureProvider {
  send(request: SignatureSendRequest): Promise<SignatureSendResponse>;
  checkStatus(providerRequestId: string): Promise<SignatureStatusResponse>;
  cancel(providerRequestId: string): Promise<void>;
}
