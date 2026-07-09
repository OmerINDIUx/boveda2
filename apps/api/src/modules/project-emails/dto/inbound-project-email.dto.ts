import { IsString, IsOptional } from 'class-validator';

export class InboundProjectEmailDto {
  @IsString()
  to!: string;

  @IsString()
  from!: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsString()
  messageId!: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @IsOptional()
  @IsString()
  references?: string;

  @IsOptional()
  attachments?: Array<{
    fileName: string;
    mimeType: string;
    contentBase64: string;
  }>;
}

export class SendProjectEmailDto {
  @IsString()
  projectId!: string;

  @IsString()
  to!: string;

  @IsOptional()
  @IsString()
  cc?: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  attachmentIds?: string[];
}
