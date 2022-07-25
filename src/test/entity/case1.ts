import { Column, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ShardingEntity } from '../../sharding-data-source.decorator';
import { ShardingType } from '../../types/typeorm-sharding.type';
import { ShardingBaseEntity } from '../../sharding-base-entity';

@ShardingEntity<Case1, number>({
    type: ShardingType.RANGE,
    findShard: (entity: Case1, minKey, maxKey) => !!entity.id && minKey <= entity.id && entity.id < maxKey,
    findShardById: (id: number, minKey, maxKey) => !!id && minKey <= id && id < maxKey,
})
export class Case1 extends ShardingBaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    age!: number;
}
