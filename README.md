# TypeORM Sharding Repository
- Enables TypeORM to be utilized in a distributed database environment.

[![Node.js CI](https://github.com/kibae/typeorm-sharding-repository/actions/workflows/node.js.yml/badge.svg)](https://github.com/kibae/typeorm-sharding-repository/actions/workflows/node.js.yml)
[![NPM Version](https://badge.fury.io/js/typeorm-sharding-repository.svg)](https://www.npmjs.com/package/typeorm-sharding-repository)
[![License](https://img.shields.io/github/license/kibae/typeorm-sharding-repository)](https://github.com/kibae/typeorm-sharding-repository/blob/main/LICENSE)

## Install
- NPM
```shell
$ npm install typeorm-sharding-repository --save
```

- Yarn
```shell
$ yarn add typeorm-sharding-repository
```

----

## Usage
### 1. Prepare DataSources.
- Instead of setting the TypeORM datasource, set the ShardingManager. Most of the settings are similar to TypeORM.
- In this example, the User entity has a key of number type. It is recommended to set the ShardingManager according to the rules of a compatible key or range of keys.
```typescript
const dbConf = {
    host: 'localhost',
    database: 'playground',
    username: 'postgres',
    password: 'postgrespw',
    synchronize: true,
    logging: 'all',
};

const shardManager = await ShardingManager.init({
    shardingType: ShardingType.RANGE,
    // The settings here apply to all database shards. 
    type: 'postgres',
    entities: [User],
    shards: [
        // Settings for each database.
        // minKey and maxKey can also use various types. For multi-columns, a tuple format is also possible.
        // onInitialize(typeorm.DataSource) callback is optional.
        { ...dbConf, port: 55000, minKey: 0, maxKey: 1000, onInitialize: (dataSource) => {/* What to do after data source initialization */} },
        { ...dbConf, port: 55001, minKey: 1000, maxKey: 2000, onInitialize: (dataSource) => {/**/} },
        { ...dbConf, port: 55002, minKey: 2000, maxKey: 3000, onInitialize: (dataSource) => {/**/} },
    ],
});
```

### 2. Apply to Entity
1. Use **@ShardingEntity** instead of **@Entity** decorator.
2. Inherit **ShardingBaseEntity** instead of **BaseEntity**.
- New data will be inserted into the added database shard.
```typescript
@ShardingEntity<User, number>({
    // Modular sharding will be supported in the future.
    type: ShardingType.RANGE,
    
    // Decide in which shard the entity will be processed. To process one entity, it can be called as many as the number of shards.
    // If data is being inserted, the key may be empty.
    // If false is returned in all cases, the last shard is chosen.
    // For minKey and maxKey, the values defined in ShardingManager are delivered.
    // If you do not want to manage multiple ShardingManagers, you can adjust the minKey and maxKey keys according to the 1:n relationship of entities in this function.
    findShard: (entity: User, minKey, maxKey) => entity.id && minKey <= entity.id && entity.id < maxKey,
    
    // Similar to findShard, but an ID value is passed instead of an entity.
    // The type of ID is ambiguous. In this example, passed as number.
    // Usually, ID values referenced in repository.findByIds() etc. are passed.
    // You need to determine which shard the id resides on.
    findShardById: (id: number, minKey, maxKey) => id && minKey <= id && id < maxKey,
})
export class User extends ShardingBaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Column() firstName: string;
    @Column() lastName: string;
    @Column() age: number;
}
```

### 3. RepositoryService (Abstract repository for TypeORM.BaseEntity and ShardingBaseEntity)
- `RepositoryService` compatible with TypeORM.BaseEntity and ShardingBaseEntity.
- With this pattern, changing whether or not sharding is applied does not change the code.
- [Repository Interface](https://github.com/kibae/typeorm-sharding-repository/tree/main/src/repository-service/abstract-repository-service.ts)
```typescript
// Both repository services have the same interface. 
const typeormRepository = RepositoryService.of(MyEntityBasedOnTypeormBaseEntity);
const shardingRepository = RepositoryService.of(MyEntityBasedOnShardingBaseEntity);

interface AbstractRepositoryService<Entity> {
    create(entityLike: DeepPartial<Entity>): Entity | Entity[];
    create(entityLike: DeepPartial<Entity>): Entity | Entity[];
    create(entityLike?: DeepPartial<Entity> | DeepPartial<Entity>[]): Entity | Entity[];

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
```

### 4. Entity [static] method
- [This test code will help you.](https://github.com/kibae/typeorm-sharding-repository/blob/main/src/test/sharding-manager.spec.ts), [(Case1 Entity)](https://github.com/kibae/typeorm-sharding-repository/blob/main/src/test/entity/case1.ts) 
```typescript
// Provides almost the same functionality as BaseEntity.
const entity = await Case1.save({
    firstName: 'Typeorm',
    lastName: 'Sharding',
    age: 10,
});

await entity.save();
await entity.remove();
await entity.softRemove();
await entity.recover();
await entity.reload();


//      _______.___________.    ___   .___________. __    ______ 
//     /       |           |   /   \  |           ||  |  /      |
//    |   (----`---|  |----`  /  ^  \ `---|  |----`|  | |  ,----'
//     \   \       |  |      /  /_\  \    |  |     |  | |  |     
// .----)   |      |  |     /  _____  \   |  |     |  | |  `----.
// |_______/       |__|    /__/     \__\  |__|     |__|  \______|

// Create entity instance
Case1.create();
Case1.create({firstName: 'Typeorm', ...});

// Returns all entities from all shards. Sort order is not guaranteed.
await Case1.find();

// Returns all entities where the value of "firstName" column is 'Typeorm' from all shards. Sort order is not guaranteed.
await Case1.find({ where: {firstName: 'Typeorm'} });

// Fetch one entity where the value of "firstName" column is 'Typeorm' from all shards.
// If an entity is found on multiple shards, the entity from the oldest shard is returned.
await Case1.findOneBy({ firstName: 'Typeorm' });

// Fetch one entity by ID from single shard.
await Case1.findOneById(1);

// Count entities where the value of "firstName" column is 'Typeorm' from all shards.
await Case1.count({ where: {firstName: 'Typeorm'} });

// Update multiple entities.
await Case1.update({ firstName: 'Typeorm' }, { lastName: 'Bob' });

// Remove entity from single shard.
await Case1.remove(entity);


//  __        ______   ____    __    ____     __       ___________    ____  _______  __      
// |  |      /  __  \  \   \  /  \  /   /    |  |     |   ____\   \  /   / |   ____||  |     
// |  |     |  |  |  |  \   \/    \/   /     |  |     |  |__   \   \/   /  |  |__   |  |     
// |  |     |  |  |  |   \            /      |  |     |   __|   \      /   |   __|  |  |     
// |  `----.|  `--'  |    \    /\    /       |  `----.|  |____   \    /    |  |____ |  `----.
// |_______| \______/      \__/  \__/        |_______||_______|   \__/     |_______||_______|

// Returns all TypeORM DataSources
Case1.getAllDataSource();

// Returns TypeORM DataSource for specific entity
Case1.getDataSource(entity);

// Returns TypeORM DataSource for specific ID value
Case1.getDataSourceById(ID_VALUE);

// Returns all TypeORM Reposigories
Case1.getAllRepository<Case1>();

// Returns TypeORM Reposigory for specific entity
Case1.getRepository<Case1>(entity);

// Returns TypeORM Manager for specific entity
Case1.getManager<Case1>(entity);
```

----

## Contributors
<a href="https://github.com/kibae/typeorm-sharding-repository/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kibae/typeorm-sharding-repository" />
</a>
