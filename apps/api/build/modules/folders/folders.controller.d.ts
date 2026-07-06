import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateFolderDto } from './dto/create-folder.dto';
import { FoldersService } from './folders.service';
export declare class FoldersController {
    private readonly folders;
    constructor(folders: FoldersService);
    list(user: RequestUser, projectId: string): Promise<import("./folder.entity").Folder[]>;
    create(user: RequestUser, dto: CreateFolderDto): Promise<import("./folder.entity").Folder>;
    disciplines(): Promise<import("./discipline.entity").Discipline[]>;
}
