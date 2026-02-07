export interface IService<T> {
  findAll(options?: any): Promise<T[]>;
  findOne(id: string): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
