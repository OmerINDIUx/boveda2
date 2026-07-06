import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
export declare class AuditService {
  private readonly logs;
  constructor(logs: Repository<AuditLog>);
  record(input: Partial<AuditLog>): Promise<AuditLog>;
  recent(): Promise<AuditLog[]>;
}
