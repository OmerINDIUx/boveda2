import { AuditService } from './audit.service';
export declare class AuditController {
  private readonly audit;
  constructor(audit: AuditService);
  recent(): Promise<import('./audit-log.entity').AuditLog[]>;
}
