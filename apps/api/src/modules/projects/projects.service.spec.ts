import { ProjectCatalogOption } from './project-catalog-option.entity';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('usa al propietario cuando el responsable llega vacío y omite campos opcionales vacíos', async () => {
    const service = Object.create(ProjectsService.prototype) as ProjectsService;
    const projectCreate = jest.fn((value) => ({ id: 'project-1', ...value }));
    const projectSave = jest.fn(async (value) => value);
    const projectFindOne = jest.fn().mockResolvedValue(undefined);
    const memberCreate = jest.fn((value) => value);
    const memberSave = jest.fn(async (value) => value);
    const memberFindOne = jest.fn().mockResolvedValue(undefined);
    const usersFind = jest.fn();
    const disciplinesFind = jest.fn();

    Reflect.set(service, 'projects', {
      create: projectCreate,
      save: projectSave,
      findOne: projectFindOne,
    });
    Reflect.set(service, 'members', {
      create: memberCreate,
      save: memberSave,
      findOne: memberFindOne,
    });
    Reflect.set(service, 'users', { find: usersFind });
    Reflect.set(service, 'disciplines', { find: disciplinesFind });
    Reflect.set(service, 'syncAssignedUsers', jest.fn().mockResolvedValue(undefined));
    Reflect.set(service, 'ensureProjectFolderStructure', jest.fn().mockResolvedValue(undefined));
    Reflect.set(service, 'audit', { record: jest.fn().mockResolvedValue(undefined) });
    Reflect.set(
      service,
      'getDetail',
      jest.fn().mockResolvedValue({ project: { id: 'project-1' } })
    );

    await service.create(
      {
        name: ' Centro Norte ',
        code: ' cc-norte ',
        description: '',
        responsibleUserId: '',
        targetDate: '',
        assignedUserIds: [],
        disciplineIds: [],
      },
      'owner-1'
    );

    expect(projectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Centro Norte',
        code: 'CC-NORTE',
        description: undefined,
        responsibleUserId: 'owner-1',
        targetDate: undefined,
        disciplineIds: [],
      })
    );
    expect(projectCreate.mock.calls[0][0]).not.toHaveProperty('assignedUserIds');
    expect(usersFind).not.toHaveBeenCalled();
    expect(disciplinesFind).not.toHaveBeenCalled();
    expect(memberCreate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-1', userId: 'owner-1', role: 'owner' })
    );
  });

  it('agrupa también el catálogo de estados usado por la migración', () => {
    const service = Object.create(ProjectsService.prototype) as ProjectsService;
    Reflect.set(service, 'logger', { warn: jest.fn() });
    const group = Reflect.get(service, 'groupCatalogOptions').bind(service) as (
      options: ProjectCatalogOption[]
    ) => Record<string, ProjectCatalogOption[]>;
    const status = {
      id: 'status-1',
      category: 'status',
      value: 'en_ejecucion',
    } as ProjectCatalogOption;

    const result = group([status]);

    expect(result.status).toEqual([status]);
    expect(result.workType).toEqual([]);
    expect(result.currentStage).toEqual([]);
    expect(result.priority).toEqual([]);
  });

  it('ignora categorías desconocidas sin derribar form-options', () => {
    const service = Object.create(ProjectsService.prototype) as ProjectsService;
    const warn = jest.fn();
    Reflect.set(service, 'logger', { warn });
    const group = Reflect.get(service, 'groupCatalogOptions').bind(service) as (
      options: ProjectCatalogOption[]
    ) => Record<string, ProjectCatalogOption[]>;

    expect(() =>
      group([{ category: 'future_category' } as unknown as ProjectCatalogOption])
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      'Categoria de catalogo del centro de costos no reconocida: future_category'
    );
  });
});
