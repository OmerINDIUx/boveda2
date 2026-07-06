import { User } from '../users/user.entity';
import { Rfi } from './rfi.entity';
export declare class RfiHistory {
  id: string;
  rfiId: string;
  rfi: Rfi;
  actorId?: string;
  actor?: User;
  action: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  createdAt: Date;
}
