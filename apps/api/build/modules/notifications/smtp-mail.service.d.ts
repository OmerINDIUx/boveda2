import { ConfigService } from '@nestjs/config';
type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};
export declare class SmtpMailService {
  private readonly config;
  private readonly logger;
  constructor(config: ConfigService);
  send(payload: MailPayload): Promise<
    | {
        status: 'skipped';
        message: string;
      }
    | {
        status: 'sent';
        message?: undefined;
      }
  >;
  private connect;
  private composeMessage;
  private escapeHtml;
  private sendData;
  private command;
  private write;
  private expect;
}
export {};
