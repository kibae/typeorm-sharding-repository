import {
    DeepPartial,
    SaveOptions,
    RemoveOptions,
    ObjectID,
    FindOptionsWhere,
    UpdateResult,
    DeleteResult,
    FindManyOptions,
    FindOneOptions,
    BaseEntity,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AbstractRepositoryService } from './abstract-repository-service';

export class TypeormRepositoryService<
    Entity extends BaseEntity,
    Base extends AbstractRepositoryService<Entity> = AbstractRepositoryService<Entity>
> implements AbstractRepositoryService<Entity>
{
    constructor(public readonly entityType: Base) {}

    create(entityLike: DeepPartial<Entity>): Entity;
    create(entityLike: DeepPartial<Entity>[]): Entity[];
    create(entityLike: DeepPartial<Entity> | DeepPartial<Entity>[]): Entity | Entity[] {
        return this.entityType.create(entityLike as any);
    }

    save(entities: DeepPartial<Entity>[], options?: SaveOptions): Promise<Entity[]>;
    save(entity: DeepPartial<Entity>, options?: SaveOptions): Promise<Entity>;
    async save(entities: DeepPartial<Entity> | DeepPartial<Entity>[], options?: SaveOptions): Promise<Entity[] | Entity> {
        return this.entityType.save(entities as any, options);
    }

    remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
    remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;
    async remove(entities: Entity[] | Entity, options?: RemoveOptions): Promise<Entity[] | Entity> {
        return this.entityType.remove(entities as any, options);
    }

    softRemove(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;
    softRemove(entity: Entity, options?: SaveOptions): Promise<Entity>;
    async softRemove(entities: Entity[] | Entity, options?: SaveOptions): Promise<Entity[] | Entity> {
        return this.entityType.softRemove(entities as any, options);
    }

    async update(
        criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>
    ): Promise<UpdateResult> {
        return this.entityType.update(criteria, partialEntity);
    }

    async delete(
        criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOptionsWhere<Entity>
    ): Promise<DeleteResult> {
        return this.entityType.delete(criteria);
    }

    async count(options?: FindManyOptions<Entity>): Promise<number> {
        return this.entityType.count(options);
    }

    async countBy(where: FindOptionsWhere<Entity>): Promise<number> {
        return this.entityType.countBy(where);
    }

    async find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
        return this.entityType.find(options);
    }

    async findBy(where: FindOptionsWhere<Entity>): Promise<Entity[]> {
        return this.entityType.findBy(where);
    }

    async findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
        return this.entityType.findAndCount(options);
    }

    async findAndCountBy(where: FindOptionsWhere<Entity>): Promise<[Entity[], number]> {
        return this.entityType.findAndCountBy(where);
    }

    async findByIds(ids: any[]): Promise<Entity[]> {
        return this.entityType.findByIds(ids);
    }

    async findOneById(id: string | number | Date | ObjectID): Promise<Entity | null> {
        return this.entityType.findOneById(id);
    }

    async findOne(options: FindOneOptions<Entity>): Promise<Entity | null | undefined> {
        return this.entityType.findOne(options);
    }

    async findOneBy(where: FindOptionsWhere<Entity>): Promise<Entity | null | undefined> {
        return this.entityType.findOneBy(where);
    }
}
