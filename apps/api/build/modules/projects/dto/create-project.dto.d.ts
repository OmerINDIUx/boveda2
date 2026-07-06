export declare class CreateProjectDto {
    name: string;
    code: string;
    description?: string;
    workType?: string;
    currentStage?: string;
    priority?: 'baja' | 'media' | 'alta' | 'critica';
    responsibleUserId?: string;
    targetDate?: string;
    status?: string;
    assignedUserIds?: string[];
    disciplineIds?: string[];
}
