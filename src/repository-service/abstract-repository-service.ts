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
import { ShardingBaseEntity } from '../sharding-base-entity';
import { BaseEntity } from 'typeorm';

export interface AbstractRepositoryService<Entity> {
    create(entityLike: DeepPartial<Entity>): Entity;
    create(entityLike: DeepPartial<Entity>[]): Entity[];

    save(entities: DeepPartial<Entity>[], options?: SaveOptions): Promise<Entity[]>;
    save(entity: DeepPartial<Entity>, options?: SaveOptions): Promise<Entity>;

    remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
    remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;

    softRemove(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;
    softRemove(entity: Entity, options?: SaveOptions): Promise<Entity>;

    update(
        criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>
    ): Promise<UpdateResult>;

    delete(
        criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOptionsWhere<Entity>
    ): Promise<DeleteResult>;

    count(options?: FindManyOptions<Entity>): Promise<number>;
    countBy(where: FindOptionsWhere<Entity>): Promise<number>;

    find(options?: FindManyOptions<Entity>): Promise<Entity[]>;
    findBy(where: FindOptionsWhere<Entity>): Promise<Entity[]>;

    findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]>;
    findAndCountBy(where: FindOptionsWhere<Entity>): Promise<[Entity[], number]>;

    findOne(options: FindOneOptions<Entity>): Promise<Entity | null | undefined>;
    findOneBy(where: FindOptionsWhere<Entity>): Promise<Entity | null | undefined>;
    findOneById(id: string | number | Date | ObjectID): Promise<Entity | null>;
    findByIds(ids: any[]): Promise<Entity[]>;
}

{
    //To check if ShardingBaseEntity conforms to AbstractRepositoryService interface.
    const __VALIDATION1__: AbstractRepositoryService<any> = ShardingBaseEntity;
    const __VALIDATION2__: AbstractRepositoryService<any> = BaseEntity;
}
