# TypeORM Sharding Repository
- Enables TypeORM to be utilized in a distributed database environment.

[![Node.js CI](https://github.com/kibae/typeorm-sharding-repo/actions/workflows/node.js.yml/badge.svg)](https://github.com/kibae/typeorm-sharding-repo/actions/workflows/node.js.yml)
[![NPM Version](https://badge.fury.io/js/typeorm-sharding-repo.svg)](https://www.npmjs.com/package/typeorm-sharding-repo)
[![License](https://img.shields.io/github/license/kibae/typeorm-sharding-repo)](https://github.com/kibae/typeorm-sharding-repo/blob/main/LICENSE)

## Install
- NPM
```shell
$ npm install typeorm-sharding-repo --save
```

- Yarn
```shell
$ yarn add typeorm-sharding-repo
```

----

## Usage
### 1. Prepare DataSources.
- Instead of setting the TypeORM datasource, set the ShardingManager.
- Most of the settings are similar to TypeORM.
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
2. Inherit ShardingBaseEntity instead of BaseEntity.
- New data will be inserted into the added database shard.
```typescript
@ShardingEntity<User, number>({
    // Modular sharding will be supported in the future.
    type: ShardingType.RANGE,
    
    // A callback in which Entity, minKey, and maxKey are passed.
    // If data is being inserted, the key may be empty.
    // If false is returned in all cases, the last shard is chosen.
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

### 3. Use repository
- [This test code will help you.](https://github.com/kibae/typeorm-sharding-repo/blob/main/src/test/sharding-manager.spec.ts), [(Case1 Entity)](https://github.com/kibae/typeorm-sharding-repo/blob/main/src/test/entity/case1.ts) 
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

// Returns all entities from all shards
await Case1.find();

// Returns all entities where the value of "firstName" column is 'Typeorm' from all shards.
await Case1.find({ where: {firstName: 'Typeorm'} });

// Fetch one entity where the value of "firstName" column is 'Typeorm' from all shards.
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
<a href="https://github.com/kibae/typeorm-sharding-repo/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kibae/typeorm-sharding-repo" />
</a>
