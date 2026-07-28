import { IsOptional, IsString } from 'class-validator';

export class InboundEmailDto {
  @IsString()
  to!: string;

  @IsString()
  from!: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;

  @IsString()
  messageId!: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string;
}
