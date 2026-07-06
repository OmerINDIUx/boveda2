import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { Discipline } from './discipline.entity';
import { Folder } from './folder.entity';
export declare class FoldersService {
    private readonly folders;
    private readonly disciplines;
    private readonly scope;
    private readonly audit;
    constructor(folders: Repository<Folder>, disciplines: Repository<Discipline>, scope: AccessScopeService, audit: AuditService);
    list(userId: string, projectId: string): Promise<Folder[]>;
    create(userId: string, dto: CreateFolderDto): Promise<Folder>;
    listDisciplines(): Promise<Discipline[]>;
}
