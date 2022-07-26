import { Entity, EntityOptions } from 'typeorm';
import { ShardingType } from './types/typeorm-sharding.type';

export interface RangeShardingEntityOptions<ENTITY, KEY_TYPE> extends EntityOptions {
    type: ShardingType.RANGE;
    findShard: (entity: ENTITY, minKey: KEY_TYPE, maxKey: KEY_TYPE) => boolean;
    findShardById: (id: any, minKey: KEY_TYPE, maxKey: KEY_TYPE) => boolean;
}

/*
export interface ModularShardingEntityOptions<ENTITY, KEY_TYPE> extends EntityOptions {
    type: ShardingType.MODULAR;
    findShard: (entity: ENTITY, dataSourceCount: number) => number;
    keyProvider: (entity: ENTITY, dataSources: DataSource[]) => Promise<KEY_TYPE>;
}
 */

export type ShardingEntityOptions<ENTITY, KEY_TYPE> = RangeShardingEntityOptions<ENTITY, KEY_TYPE>;
// | ModularShardingEntityOptions<ENTITY, KEY_TYPE>;

export function ShardingEntity<ENTITY, KEY_TYPE = number>(options: ShardingEntityOptions<ENTITY, KEY_TYPE>) {
    return (target: Function) => {
        let entityOptions: EntityOptions;

        if (options.type === ShardingType.RANGE) {
            const { type, findShard, findShardById, ...opt } = options;
            entityOptions = opt;
            Reflect.defineMetadata('SHARDING_TYPE', type, target);
            Reflect.defineMetadata('SHARDING_FUNC', findShard, target);
            Reflect.defineMetadata('SHARDING_FUNC_BY_ID', findShardById, target);
            /*
        } else if (options.type === ShardingType.MODULAR) {
            const { type, findShard, keyProvider, ...opt } = options;
            entityOptions = opt;
            Reflect.defineMetadata('SHARDING_TYPE', type, target);
            Reflect.defineMetadata('SHARDING_FUNC', findShard, target);
            Reflect.defineMetadata('SHARDING_KEY_PROVIDER', keyProvider, target);
             */
        } else throw new Error('ShardingEntity: Unsupported sharding type');

        Entity(entityOptions)(target);
    };
}
