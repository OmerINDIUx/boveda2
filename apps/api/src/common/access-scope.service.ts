import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectMember } from '../modules/projects/project-member.entity';

@Injectable()
export class AccessScopeService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly members: Repository<ProjectMember>
  ) {}

  async visibleProjectIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.members.find({ where: { userId } });
    return rows.map((row) => row.projectId);
  }

  async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const count = await this.members.count({ where: { userId, projectId } });
    return count > 0;
  }

  async scopeWhereProjectIn(userId: string): Promise<{ projectId: ReturnType<typeof In> }> {
    const projectIds = await this.visibleProjectIdsForUser(userId);
    return { projectId: In(projectIds.length ? projectIds : ['__none__']) };
  }
}
