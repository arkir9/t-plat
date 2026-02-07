import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';

export abstract class BaseService<T extends { id: string }> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  async create(entity: DeepPartial<T>): Promise<T> {
    const newEntity = this.repository.create(entity as DeepPartial<T>);
    const saved = await this.repository.save(newEntity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async update(id: string, entity: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, entity as any);
    const updated = await this.repository.findOne({ where: { id } as any });
    if (!updated) {
      throw new Error('Entity not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }
}
