import { ShardingManager } from '../sharding-manager';
import { ShardingType } from '../types/typeorm-sharding.type';
import { Case1 } from './entity/case1';
import { DataSource } from 'typeorm';

async function updateSeq(dataSource: DataSource, val: number): Promise<void> {
    await dataSource.query(`INSERT INTO sqlite_sequence(name, seq) VALUES('case1', ${val})`);
}

async function getDataSource(): Promise<ShardingManager> {
    return ShardingManager.init({
        shardingType: ShardingType.RANGE,
        type: 'sqlite',
        synchronize: true,
        logging: 'all',
        entities: [Case1],
        shards: [
            { database: ':memory:', minKey: 0, maxKey: 1000, onInitialize: (dataSource) => updateSeq(dataSource, 0) },
            { database: ':memory:', minKey: 1000, maxKey: 2000, onInitialize: (dataSource) => updateSeq(dataSource, 1000) },
            { database: ':memory:', minKey: 2000, maxKey: 3000, onInitialize: (dataSource) => updateSeq(dataSource, 2000) },
        ],
    });
}

let dataSource: ShardingManager;
describe('ShardingManager', () => {
    beforeEach(async () => {
        dataSource = await getDataSource();
    });

    afterEach(async () => {
        if (dataSource) {
            await dataSource.destroy();
            dataSource.dataSources.forEach((dataSource) => expect(dataSource.isInitialized).toEqual(false));
        }
    });

    it('DataSource', async () => {
        expect(dataSource).toBeDefined();
        expect(dataSource.dataSources.length).toBe(3);
    });

    it('Case1 - insert into last shard', async () => {
        let entity;
        entity = await Case1.save({
            firstName: 'Typeorm',
            lastName: 'Sharding',
            age: 10,
        });

        expect((await Case1.getDataSourceById(1).manager.query(`SELECT * FROM case1`)).length).toBe(0);
        expect((await Case1.getDataSourceById(1001).manager.query(`SELECT * FROM case1`)).length).toBe(0);
        expect((await Case1.getDataSourceById(2001).manager.query(`SELECT * FROM case1`)).length).toBe(1);

        expect((await Case1.find()).length).toBe(1);
        expect(await Case1.findOneBy({ firstName: 'Typeorm' })).toBeDefined();
        expect(await Case1.findOneBy({ firstName: 'typeorM' })).toBeUndefined();

        expect((await Case1.findOneById(1))?.firstName).toBeUndefined();
        expect((await Case1.findOneById(1001))?.firstName).toBeUndefined();
        expect((await Case1.findOneById(2001))?.firstName).toBeDefined();
    });

    it('Case1 - force insert into other shard', async () => {
        let entity;
        entity = await Case1.save({
            firstName: 'Typeorm',
            lastName: 'Sharding',
            age: 10,
            id: 1100,
        });

        expect((await Case1.getDataSourceById(1).manager.query(`SELECT * FROM case1`)).length).toBe(0);
        expect((await Case1.getDataSourceById(1001).manager.query(`SELECT * FROM case1`)).length).toBe(1);
        expect((await Case1.getDataSourceById(2001).manager.query(`SELECT * FROM case1`)).length).toBe(0);

        expect((await Case1.find()).length).toBe(1);
        expect(await Case1.findOneBy({ firstName: 'Typeorm' })).toBeDefined();
        expect(await Case1.findOneBy({ firstName: 'typeorM' })).toBeUndefined();

        expect((await Case1.findOneById(1))?.firstName).toBeUndefined();
        expect((await Case1.findOneById(1001))?.firstName).toBeUndefined();
        expect((await Case1.findOneById(2001))?.firstName).toBeUndefined();
        expect((await Case1.findOneById(1100))?.firstName).toBeDefined();
    });

    it('Case1 - update', async () => {
        let entity;
        entity = await Case1.save({
            firstName: 'Typeorm',
            lastName: 'Sharding',
            age: 10,
            id: 1100,
        });

        expect((await Case1.findOneById(1100))?.firstName).toBeDefined();
        expect((await Case1.findOneBy({ firstName: 'Typeorm' }))?.firstName).toBeDefined();
        expect((await Case1.findOneBy({ firstName: 'typeorM' }))?.firstName).toBeUndefined();

        entity.firstName = 'typeorM';
        await entity.save();

        expect((await Case1.findOneBy({ firstName: 'Typeorm' }))?.firstName).toBeUndefined();
        expect((await Case1.findOneBy({ firstName: 'typeorM' }))?.firstName).toBeDefined();
        expect((await Case1.findOneById(1100))?.firstName).toBe('typeorM');
    });

    it('Case1 - static method', async () => {
        let entity;
        entity = await Case1.save({
            firstName: 'Typeorm',
            lastName: 'Sharding',
            age: 10,
            id: 1100,
        });

        expect((await Case1.findOne({ where: { firstName: 'Typeorm' } }))?.firstName).toBeDefined();
        expect((await Case1.findOne({ where: { firstName: 'typeorM' } }))?.firstName).toBeUndefined();
        expect((await Case1.findOneById(1100))?.firstName).toBe('Typeorm');
        expect((await Case1.findByIds([1100]))?.length).toBeGreaterThan(0);

        const [rows, count] = await Case1.findAndCount();
        expect(count).toBe(1);
        expect(rows.length).toBe(1);
        expect(rows[0].id).toBe(1100);
        expect(rows[0].firstName).toBe('Typeorm');

        expect(await Case1.count()).toBe(1);
        expect((await Case1.update({ id: 1100 }, { lastName: 'Bob' })).affected).toBe(1);
        expect((await Case1.findOneById(1100))?.lastName).toBe('Bob');
        expect((await Case1.remove(entity)).id).toBeUndefined();
        expect((await Case1.findOneById(1100))?.lastName).toBeUndefined();
    });
});
