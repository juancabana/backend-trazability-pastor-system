import { Repository, FindOptionsWhere } from 'typeorm';

export abstract class BaseRepository<T extends { id: string }> {
  protected constructor(protected readonly repo: Repository<T>) {}

  findById(id: string): Promise<T | null> {
    return this.repo.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async create(data: Partial<T>): Promise<T> {
    // TypeORM's create() overloads require DeepPartial<T>; the cast is safe here
    // because our entities always match DeepPartial at runtime.
    const entity = this.repo.create(data as Parameters<typeof this.repo.create>[0]);
    return this.repo.save(entity) as Promise<T>;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repo.update(id, data as Parameters<Repository<T>['update']>[1]);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
