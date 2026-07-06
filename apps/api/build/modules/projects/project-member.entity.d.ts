import { User } from '../users/user.entity';
import { Project } from './project.entity';
export declare class ProjectMember {
  id: string;
  projectId: string;
  project: Project;
  userId: string;
  user: User;
  role: 'owner' | 'manager' | 'contributor' | 'viewer';
  canManageDocuments: boolean;
  canManageContracts: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
