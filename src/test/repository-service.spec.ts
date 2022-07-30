import { ShardingManager } from '../sharding-manager';
import { ShardingType } from '../types/typeorm-sharding.type';
import { Case1 } from './entity/case1';
import { DataSource } from 'typeorm';
import { RepositoryService } from '../repository-service/repository-service';
import { Case3 } from './entity/case3';

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
describe('Repository Service', () => {
    beforeEach(async () => {
        dataSource = await getDataSource();
    });

    afterEach(async () => {
        dataSource?.destroy();
    });

    it('Case1 - insert into last shard', async () => {
        const repository = RepositoryService.of(Case1);

        const entity = await repository
            .create({
                firstName: 'Typeorm',
                lastName: 'Sharding',
                age: 10,
            })
            .save();

        expect((await repository.findByIds([1])).length).toBe(0);
        expect((await repository.findByIds([1001])).length).toBe(0);
        expect((await repository.findByIds([2001])).length).toBe(1);

        expect((await repository.find()).length).toBe(1);
        expect(await repository.findOneBy({ firstName: 'Typeorm' })).toBeDefined();
        expect(await repository.findOneBy({ firstName: 'typeorM' })).toBeUndefined();

        expect((await repository.findOneById(1))?.firstName).toBeUndefined();
        expect((await repository.findOneById(1001))?.firstName).toBeUndefined();
        expect((await repository.findOneById(2001))?.firstName).toBeDefined();
    });

    it('Case1 - force insert into other shard', async () => {
        const repository = RepositoryService.of(Case1);

        const entity = await repository
            .create({
                firstName: 'Typeorm',
                lastName: 'Sharding',
                age: 10,
                id: 1100,
            })
            .save();

        expect((await repository.findByIds([1])).length).toBe(0);
        expect((await repository.findByIds([1001])).length).toBe(0);
        expect((await repository.findByIds([1100])).length).toBe(1);
        expect((await repository.findByIds([2001])).length).toBe(0);

        expect((await repository.find()).length).toBe(1);
        expect(await repository.findOneBy({ firstName: 'Typeorm' })).toBeDefined();
        expect(await repository.findOneBy({ firstName: 'typeorM' })).toBeUndefined();

        expect((await repository.findOneById(1))?.firstName).toBeUndefined();
        expect((await repository.findOneById(1001))?.firstName).toBeUndefined();
        expect((await repository.findOneById(2001))?.firstName).toBeUndefined();
        expect((await repository.findOneById(1100))?.firstName).toBeDefined();
    });

    it('Case1 - update', async () => {
        const repository = RepositoryService.of(Case1);

        const entity = await repository
            .create({
                firstName: 'Typeorm',
                lastName: 'Sharding',
                age: 10,
                id: 1100,
            })
            .save();

        expect((await repository.findOneById(1100))?.firstName).toBeDefined();
        expect((await repository.findOneBy({ firstName: 'Typeorm' }))?.firstName).toBeDefined();
        expect((await repository.findOneBy({ firstName: 'typeorM' }))?.firstName).toBeUndefined();

        entity.firstName = 'typeorM';
        await entity.save();

        expect((await repository.findOneBy({ firstName: 'Typeorm' }))?.firstName).toBeUndefined();
        expect((await repository.findOneBy({ firstName: 'typeorM' }))?.firstName).toBeDefined();
        expect((await repository.findOneById(1100))?.firstName).toBe('typeorM');
    });

    it('Case1 - misc', async () => {
        const repository = RepositoryService.of(Case1);

        const entity = await repository
            .create({
                firstName: 'Typeorm',
                lastName: 'Sharding',
                age: 10,
                id: 1100,
            })
            .save();

        expect((await repository.findOne({ where: { firstName: 'Typeorm' } }))?.firstName).toBeDefined();
        expect((await repository.findOne({ where: { firstName: 'typeorM' } }))?.firstName).toBeUndefined();
        expect((await repository.findOneById(1100))?.firstName).toBe('Typeorm');
        expect((await repository.findByIds([1100]))?.length).toBeGreaterThan(0);

        const [rows, count] = await repository.findAndCount();
        expect(count).toBe(1);
        expect(rows.length).toBe(1);
        expect(rows[0].id).toBe(1100);
        expect(rows[0].firstName).toBe('Typeorm');

        expect(await repository.count()).toBe(1);
        expect((await repository.update({ id: 1100 }, { lastName: 'Bob' })).affected).toBe(1);
        expect((await repository.findOneById(1100))?.lastName).toBe('Bob');
        expect((await repository.remove(entity)).id).toBeUndefined();
        expect((await repository.findOneById(1100))?.lastName).toBeUndefined();
    });

    it('Case3 - TypeORM repository service', async () => {
        const typeorm = await new DataSource({
            type: 'sqlite',
            synchronize: true,
            logging: 'all',
            entities: [Case3],
            database: ':memory:',
        }).initialize();

        const repository1 = RepositoryService.of(Case1);
        const repository2 = RepositoryService.of(Case3);

        const entity1 = await repository1
            .create({
                firstName: 'Typeorm',
                lastName: 'Sharding',
                age: 10,
                id: 1100,
            })
            .save();

        const entity2 = await repository2
            .create({
                firstName: 'Typeorm',
                lastName: 'Sharding',
                age: 10,
                id: 1100,
            })
            .save();

        expect(await repository1.count()).toBe(1);
        expect((await repository1.update({ id: 1100 }, { lastName: 'Bob' })).affected).toBe(1);
        expect((await repository1.findOneById(1100))?.lastName).toBe('Bob');
        expect((await repository1.remove(entity1)).id).toBeUndefined();
        expect((await repository1.findOneById(1100))?.lastName).toBeUndefined();

        expect(await repository2.count()).toBe(1);
        expect((await repository2.update({ id: 1100 }, { lastName: 'Bob' })).affected).toBe(1);
        expect((await repository2.findOneById(1100))?.lastName).toBe('Bob');
        expect((await repository2.remove(entity2)).id).toBeUndefined();
        expect((await repository2.findOneById(1100))?.lastName).toBeUndefined();
    });
});
