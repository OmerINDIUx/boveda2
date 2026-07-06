import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>) {}

  record(input: Partial<AuditLog>) {
    return this.logs.save(this.logs.create(input));
  }

  recent() {
    return this.logs.find({ order: { createdAt: 'DESC' }, take: 100 });
  }
}
