export declare class CreateVersionDto {
  documentId: string;
  revision: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  base64Content: string;
  sizeBytes: number;
  notes?: string;
}
