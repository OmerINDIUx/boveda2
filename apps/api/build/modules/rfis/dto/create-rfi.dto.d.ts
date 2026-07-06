declare class RfiAttachmentInputDto {
  fileName: string;
  mimeType: string;
  base64Content: string;
}
export declare class CreateRfiDto {
  projectId: string;
  documentId?: string;
  title: string;
  description: string;
  assignedToId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: string;
  attachments?: RfiAttachmentInputDto[];
}
export { RfiAttachmentInputDto };
