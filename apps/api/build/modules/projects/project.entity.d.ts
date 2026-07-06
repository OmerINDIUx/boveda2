import { User } from '../users/user.entity';
export declare class Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  workType?: string;
  currentStage?: string;
  priority: 'baja' | 'media' | 'alta' | 'critica';
  responsibleUserId?: string;
  responsibleUser?: User;
  targetDate?: string;
  status: string;
  isActive: boolean;
  disciplineIds?: string[];
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
