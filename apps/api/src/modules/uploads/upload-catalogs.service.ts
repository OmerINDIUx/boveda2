import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { UploadCatalog } from './upload-catalog.entity';
import { CreateUploadCatalogDto, UpdateUploadCatalogDto } from './dto/upload-catalog.dto';

@Injectable()
export class UploadCatalogsService {
  constructor(
    @InjectRepository(UploadCatalog)
    private readonly catalogs: Repository<UploadCatalog>
  ) {}

  async list(projectId?: string) {
    const where: FindOptionsWhere<UploadCatalog> | FindOptionsWhere<UploadCatalog>[] = projectId
      ? [
          { projectId, isActive: true },
          { projectId: IsNull(), isActive: true },
        ]
      : { isActive: true };

    return this.catalogs.find({
      where,
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  async create(dto: CreateUploadCatalogDto) {
    return this.catalogs.save(this.catalogs.create(dto));
  }

  async update(id: string, dto: UpdateUploadCatalogDto) {
    const catalog = await this.catalogs.findOne({ where: { id } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (dto.label !== undefined) catalog.label = dto.label;
    if (dto.description !== undefined) catalog.description = dto.description;
    if (dto.sortOrder !== undefined) catalog.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) catalog.isActive = dto.isActive;
    return this.catalogs.save(catalog);
  }
}
