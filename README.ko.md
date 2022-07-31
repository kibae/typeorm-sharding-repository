# TypeORM Sharding Repository
- TypeORM을 분산 데이터베이스 환경에서 활용할 수 있게 합니다.

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
- TypeORM DataSource 설정 대신 ShardingManager을 설정해 주세요. 대부분의 설정은 TypeORM과 동일합니다.
- 이 예제의 User entity는 정수형의 키를 가지고 있습니다. 호환되는 키나 키의 범위 규칙에 따라 ShardingManager를 설정하는 것을 추천합니다.
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
    // 이곳에 입력되는 공통 설정(TypeORM.BaseDataSourceOptions)은 모든 shard에 적용됩니다. 
    type: 'postgres',
    entities: [User],
    shards: [
        // 개별 데이터베이스 shard의 설정을 합니다.
        // minKey, maxKey는 다양한 타입을 가질수 있습니다. 멀티컬럼 PK를 가진 경우 튜플 형태로 구성할 수도 있습니다.
        // onInitialize(typeorm.DataSource) callback 은 옵션입니다.
        { ...dbConf, port: 55000, minKey: 0, maxKey: 1000, onInitialize: (dataSource) => {/* TypeORM.DataSource.initialize() 이후 실행됨 */} },
        { ...dbConf, port: 55001, minKey: 1000, maxKey: 2000, onInitialize: (dataSource) => {/**/} },
        { ...dbConf, port: 55002, minKey: 2000, maxKey: 3000, onInitialize: (dataSource) => {/**/} },
    ],
});
```

### 2. Apply to Entity
1. **@Entity** decorator 대신 **@ShardingEntity** decorator를 사용하세요.
2. **BaseEntity** 대신 **ShardingBaseEntity**를 상속받으세요.
- 새로운 데이터가 추가된 shard에 쌓이기 시작합니다.
```typescript
@ShardingEntity<User, number>({
    // Modular sharding은 추후 지원 예정입니다.
    type: ShardingType.RANGE,
    
    // Entity가 어떤 shard에서 처리될 지 알려줘야 합니다. 하나의 entity를 처리하기 위해 최대 shard 갯수만큼 호출됩니다.
    // 새로운 entity가 추가될 때에는 키 값이 비어있습니다.
    // 모든 shard에 대해 false가 리턴된 경우 마지막 샤드가 선택됩니다.
    // minKey, maxKey는 ShardingManager에 정의된 값들이 전달됩니다.
    // 여러 ShardingManager를 관리하고 싶지 않다면 이 함수에서 entity 간의 관계에 따라 minKey, maxKey를 기준으로만 삼고 데이터의 양을 조절할 수 있습니다.
    findShard: (entity: User, minKey, maxKey) => entity.id && minKey <= entity.id && entity.id < maxKey,
    
    // findShard과 유사하지만 판정을 entity가 아닌 키 값을 기준으로 합니다.
    // ID 값은 타입이 모호합니다. 이 예제에서는 number로 전달받았으나, 배열(멀티컬럼)이나 문자열 등 다양한 값이 전달되게 됩니다.
    // repository.findByIds() 등이 호출될 때 전달받는 ID 들이 전달되므로, 어떤 구조의 entity냐에 따라 전달되는 값의 형태가 달라지기 때문입니다.
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
- TypeORM.BaseEntity과 ShardingBaseEntity와 호횐되는 `RepositoryService`를 제공합니다.
- 이 패턴을 활용할 경우 sharding 적용 여부를 변경하더라도 코드의 변경이 없습니다.
- [Repository Interface](https://github.com/kibae/typeorm-sharding-repository/tree/main/src/repository-service/abstract-repository-service.ts)
```typescript
// 두 저장소 서비스는 동일한 인터페이스를 가지고 있습니다. 
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
- [테스트 코드를 참조하세요.](https://github.com/kibae/typeorm-sharding-repository/blob/main/src/test/sharding-manager.spec.ts), [(Case1 Entity)](https://github.com/kibae/typeorm-sharding-repository/blob/main/src/test/entity/case1.ts)
```typescript
// TypeORM.BaseEntity와 거의 동일한 기능들을 제공합니다.
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

// Entity instance를 생성합니다.
Case1.create();
Case1.create({firstName: 'Typeorm', ...});

// 모든 shard의 모든 entity를 반환합니다. 정렬 순서는 보장되지 않습니다.
await Case1.find();

// 모든 shard에서 firstName이 Typeorm인 모든 entity를 반환합니다. 정렬 순서는 보장되지 않습니다.
await Case1.find({ where: {firstName: 'Typeorm'} });

// 모든 shard를 검색해 firstName이 Typeorm인 하나의 entity를 반환합니다.
// 여러 shard에서 발견된 경우 가장 오래된 shard의 entity가 반환됩니다.
await Case1.findOneBy({ firstName: 'Typeorm' });

// ID로 검색하여 하나의 entity를 반환합니다.
await Case1.findOneById(1);

// 모든 shard에서 firstName이 Typeorm인 모든 entity의 수를 반환합니다.
await Case1.count({ where: {firstName: 'Typeorm'} });

// 여러 entity를 update합니다.
await Case1.update({ firstName: 'Typeorm' }, { lastName: 'Bob' });

// Entity를 삭제합니다.
await Case1.remove(entity);


//  __        ______   ____    __    ____     __       ___________    ____  _______  __      
// |  |      /  __  \  \   \  /  \  /   /    |  |     |   ____\   \  /   / |   ____||  |     
// |  |     |  |  |  |  \   \/    \/   /     |  |     |  |__   \   \/   /  |  |__   |  |     
// |  |     |  |  |  |   \            /      |  |     |   __|   \      /   |   __|  |  |     
// |  `----.|  `--'  |    \    /\    /       |  `----.|  |____   \    /    |  |____ |  `----.
// |_______| \______/      \__/  \__/        |_______||_______|   \__/     |_______||_______|

// 모든 TypeORM DataSource
Case1.getAllDataSource();

// 특정 entity를 담당하는 TypeORM DataSource
Case1.getDataSource(entity);

// 특정 ID를 담당하는 TypeORM DataSource
Case1.getDataSourceById(ID_VALUE);

// 모든 TypeORM Reposigory
Case1.getAllRepository<Case1>();

// 특정 entity를 담당하는 TypeORM Reposigory
Case1.getRepository<Case1>(entity);

// 특정 entity를 담당하는 TypeORM Manager
Case1.getManager<Case1>(entity);
```

----

## Contributors
<a href="https://github.com/kibae/typeorm-sharding-repository/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kibae/typeorm-sharding-repository" />
</a>
