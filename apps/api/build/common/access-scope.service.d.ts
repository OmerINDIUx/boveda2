import { In, Repository } from 'typeorm';
import { ProjectMember } from '../modules/projects/project-member.entity';
export declare class AccessScopeService {
    private readonly members;
    constructor(members: Repository<ProjectMember>);
    visibleProjectIdsForUser(userId: string): Promise<string[]>;
    canAccessProject(userId: string, projectId: string): Promise<boolean>;
    scopeWhereProjectIn(userId: string): Promise<{
        projectId: ReturnType<typeof In>;
    }>;
}
