import { ShardingManager } from '../sharding-manager';
import { ShardingType } from '../types/typeorm-sharding.type';
import { Case1 } from './entity/case1';

const dbConf = {};

describe('ShardingManager', () => {
    it('Case1', async () => {
        const dataSource = await ShardingManager.init({
            shardingType: ShardingType.RANGE,
            type: 'postgres',
            entities: [Case1],
            shards: [
                { ...dbConf, port: 55000, minKey: 0, maxKey: 1000 },
                { ...dbConf, port: 55001, minKey: 1000, maxKey: 2000 },
                { ...dbConf, port: 55002, minKey: 2000, maxKey: 3000 },
            ],
        });
    });
});
