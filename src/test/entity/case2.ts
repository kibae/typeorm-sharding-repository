import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ShardingEntity } from '../../sharding-data-source.decorator';
import { ShardingType } from '../../types/typeorm-sharding.type';
import { ShardingBaseEntity } from '../../sharding-base-entity';

@ShardingEntity<Case2, number>({
    type: ShardingType.RANGE,
    findShard: (entity: Case2, minKey, maxKey) => !!entity.seq && minKey <= entity.seq && entity.seq < maxKey,
    findShardById: (id: number, minKey, maxKey) => !!id && minKey <= id && id < maxKey,
})
export class Case2 extends ShardingBaseEntity {
    @PrimaryGeneratedColumn()
    seq!: number;

    @Column()
    title!: string;

    @Column()
    body!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
