import { BaseEntity } from 'typeorm';
import { ShardingBaseEntity } from '../sharding-base-entity';
import { MetadataUtils } from 'typeorm/metadata-builder/MetadataUtils';
import { AbstractRepositoryService } from './abstract-repository-service';
import { ShardingRepositoryService } from './sharding-repository-service';
import { TypeormRepositoryService } from './typeorm-repository-service';

export class RepositoryService {
    public static of<T extends typeof BaseEntity | typeof ShardingBaseEntity>(entityType: T): AbstractRepositoryService<InstanceType<T>> {
        if (MetadataUtils.getInheritanceTree(entityType).includes(ShardingBaseEntity))
            return new ShardingRepositoryService(entityType as any) as any;
        else return new TypeormRepositoryService(entityType as any) as any;
    }
}

{
    //To check if ShardingBaseEntity conforms to AbstractRepositoryService interface.
    const __VALIDATION1__: AbstractRepositoryService<any> = ShardingBaseEntity;
    const __VALIDATION2__: AbstractRepositoryService<any> = BaseEntity;
}
