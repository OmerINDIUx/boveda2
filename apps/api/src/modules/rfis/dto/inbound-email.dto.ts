import { IsString } from 'class-validator';

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

  @IsString()
  inReplyTo!: string;
}
