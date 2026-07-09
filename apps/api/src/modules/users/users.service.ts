import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Role } from '../roles/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly audit: AuditService
  ) {}

  async findAll() {
    const users = await this.users.find({ relations: ['roles'] });
    return users.map((user) => this.serializeUser(user));
  }

  async findProfile(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.serializeUser(user);
  }

  findByEmailWithRoles(email: string) {
    return this.users.findOne({ where: { email }, relations: ['roles', 'roles.permissions'] });
  }

  findByIdWithRoles(id: string) {
    return this.users.findOne({ where: { id }, relations: ['roles', 'roles.permissions'] });
  }

  async create(dto: CreateUserDto) {
    const user = this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 12),
      roles: dto.roleIds?.length ? await this.roles.findBy({ id: In(dto.roleIds) }) : [],
    });
    const saved = await this.users.save(user);
    await this.audit.record({
      actorId: saved.id,
      action: 'user.create',
      entityType: 'user',
      entityId: saved.id,
      metadata: { email: saved.email, roleIds: dto.roleIds ?? [] },
    });
    return this.serializeUser(saved);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.users.findOne({ where: { id }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const before = this.serializeUser(user);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.language !== undefined) user.language = dto.language;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 12);
    if (dto.roleIds) user.roles = await this.roles.findBy({ id: In(dto.roleIds) });

    const saved = await this.users.save(user);
    await this.audit.record({
      actorId: id,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      metadata: { before, after: this.serializeUser(saved) },
    });
    return this.serializeUser(saved);
  }

  async updateLanguage(id: string, language: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.language = language;
    await this.users.save(user);
    return { language };
  }

  updateProfile(id: string, dto: UpdateUserDto) {
    return this.update(id, {
      name: dto.name,
      email: dto.email,
      password: dto.password,
      language: dto.language,
    });
  }

  setActive(id: string, active: boolean) {
    return this.update(id, { active });
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
      language: user.language,
      roles: user.roles?.map((role) => ({ id: role.id, key: role.key, name: role.name })) ?? [],
    };
  }
}
