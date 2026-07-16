import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { FoldersService } from './folders.service';
export declare class FoldersController {
    private readonly folders;
    constructor(folders: FoldersService);
    list(user: RequestUser, projectId: string): Promise<import("./folder.entity").Folder[]>;
    create(user: RequestUser, dto: CreateFolderDto): Promise<import("./folder.entity").Folder>;
    disciplines(): Promise<import("./discipline.entity").Discipline[]>;
    createDiscipline(user: RequestUser, dto: CreateDisciplineDto): Promise<import("./discipline.entity").Discipline>;
    updateDiscipline(user: RequestUser, id: string, dto: UpdateDisciplineDto): Promise<import("./discipline.entity").Discipline>;
    deactivateDiscipline(user: RequestUser, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
}
