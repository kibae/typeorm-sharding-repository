import { ShardingBaseEntity } from '../sharding-base-entity';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { RemoveOptions } from 'typeorm/repository/RemoveOptions';
import { ObjectID } from 'typeorm/browser/driver/mongodb/typings';
import { FindOptionsWhere } from 'typeorm/browser/find-options/FindOptionsWhere';
import { QueryDeepPartialEntity } from 'typeorm/browser/query-builder/QueryPartialEntity';
import { UpdateResult } from 'typeorm/browser/query-builder/result/UpdateResult';
import { DeleteResult } from 'typeorm/browser/query-builder/result/DeleteResult';
import { FindManyOptions } from 'typeorm/browser/find-options/FindManyOptions';
import { FindOneOptions } from 'typeorm/browser/find-options/FindOneOptions';
import { AbstractRepositoryService } from './abstract-repository-service';

export class ShardingRepositoryService<
    Entity extends ShardingBaseEntity,
    Base extends AbstractRepositoryService<Entity> = AbstractRepositoryService<Entity>
> implements AbstractRepositoryService<Entity>
{
    constructor(public readonly shardingEntityType: Base) {}

    create(entityLike: DeepPartial<Entity>): Entity;
    create(entityLike: DeepPartial<Entity>[]): Entity[];
    create(entityLike: DeepPartial<Entity> | DeepPartial<Entity>[]): Entity | Entity[] {
        return this.shardingEntityType.create(entityLike as any);
    }

    save(entities: DeepPartial<Entity>[], options?: SaveOptions): Promise<Entity[]>;
    save(entity: DeepPartial<Entity>, options?: SaveOptions): Promise<Entity>;
    async save(entities: DeepPartial<Entity> | DeepPartial<Entity>[], options?: SaveOptions): Promise<Entity[] | Entity> {
        return this.shardingEntityType.save(entities as any, options);
    }

    remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
    remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;
    async remove(entities: Entity[] | Entity, options?: RemoveOptions): Promise<Entity[] | Entity> {
        return this.shardingEntityType.remove(entities as any, options);
    }

    softRemove(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;
    softRemove(entity: Entity, options?: SaveOptions): Promise<Entity>;
    async softRemove(entities: Entity[] | Entity, options?: SaveOptions): Promise<Entity[] | Entity> {
        return this.shardingEntityType.softRemove(entities as any, options);
    }

    async update(
        criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>
    ): Promise<UpdateResult> {
        return this.shardingEntityType.update(criteria, partialEntity);
    }

    async delete(
        criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOptionsWhere<Entity>
    ): Promise<DeleteResult> {
        return this.shardingEntityType.delete(criteria);
    }

    async count(options?: FindManyOptions<Entity>): Promise<number> {
        return this.shardingEntityType.count(options);
    }

    async countBy(where: FindOptionsWhere<Entity>): Promise<number> {
        return this.shardingEntityType.countBy(where);
    }

    async find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
        return this.shardingEntityType.find(options);
    }

    async findBy(where: FindOptionsWhere<Entity>): Promise<Entity[]> {
        return this.shardingEntityType.findBy(where);
    }

    async findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
        return this.shardingEntityType.findAndCount(options);
    }

    async findAndCountBy(where: FindOptionsWhere<Entity>): Promise<[Entity[], number]> {
        return this.shardingEntityType.findAndCountBy(where);
    }

    async findByIds(ids: any[]): Promise<Entity[]> {
        return this.shardingEntityType.findByIds(ids);
    }

    async findOneById(id: string | number | Date | ObjectID): Promise<Entity | null> {
        return this.shardingEntityType.findOneById(id);
    }

    async findOne(options: FindOneOptions<Entity>): Promise<Entity | null | undefined> {
        return this.shardingEntityType.findOne(options);
    }

    async findOneBy(where: FindOptionsWhere<Entity>): Promise<Entity | null | undefined> {
        return this.shardingEntityType.findOneBy(where);
    }
}
