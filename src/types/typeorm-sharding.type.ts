import { BaseDataSourceOptions } from 'typeorm/data-source/BaseDataSourceOptions';
import { AuroraMysqlConnectionOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions';
import { AuroraPostgresConnectionOptions } from 'typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export interface AbstractShardingDataSource<S, T extends BaseDataSourceOptions> extends BaseDataSourceOptions {
    shards: Array<Omit<T, keyof BaseDataSourceOptions> & S>;
}

export interface PostgresShardingDataSource<S> extends AbstractShardingDataSource<S, PostgresConnectionOptions> {
    type: 'postgres';
}

export interface AuroraPostgresShardingDataSource<S> extends AbstractShardingDataSource<S, AuroraPostgresConnectionOptions> {
    type: 'aurora-postgres';
}

export interface MysqlShardingDataSource<S> extends AbstractShardingDataSource<S, MysqlConnectionOptions> {
    type: 'mysql' | 'mariadb';
}

export interface AuroraMysqlShardingDataSource<S> extends AbstractShardingDataSource<S, AuroraMysqlConnectionOptions> {
    type: 'aurora-mysql';
}

export interface OracleShardingDataSource<S> extends AbstractShardingDataSource<S, OracleConnectionOptions> {
    type: 'oracle';
}

// ... "cockroachdb" | "sap" | "sqlite" | "cordova" | "react-native" | "nativescript" | "sqljs" | "mssql" | "mongodb" | "expo" | "better-sqlite3" | "capacitor" | "spanner"

export type AbstractShardingDataSourceOptions<S = {}> =
    | PostgresShardingDataSource<S>
    | AuroraPostgresShardingDataSource<S>
    | MysqlShardingDataSource<S>
    | AuroraMysqlShardingDataSource<S>
    | OracleShardingDataSource<S>;

export enum ShardingType {
    RANGE = 'RANGE',
    // MODULAR = 'MODULAR',
}

export type DefaultShardingKeyType = number | string;

//.______          ___      .__   __.   _______  _______
// |   _  \        /   \     |  \ |  |  /  _____||   ____|
// |  |_)  |      /  ^  \    |   \|  | |  |  __  |  |__
// |      /      /  /_\  \   |  . `  | |  | |_ | |   __|
// |  |\  \----./  _____  \  |  |\   | |  |__| | |  |____
// | _| `._____/__/     \__\ |__| \__|  \______| |_______|
export interface RangeShardingRule<T> {
    /**
     * greater or equals
     */
    minKey: T;

    /**
     * lesser
     */
    maxKey: T;
}

export type RangeShardingDataSourceOptions<T = DefaultShardingKeyType> = AbstractShardingDataSourceOptions<RangeShardingRule<T>> & {
    shardingType: ShardingType.RANGE;
};

/*
export type ModularShardingDataSourceOptions<T = DefaultShardingKeyType> = AbstractShardingDataSourceOptions & {
    shardingType: ShardingType.MODULAR;
};

export type ShardingDataSourceOptions = RangeShardingDataSourceOptions | ModularShardingDataSourceOptions;
 */
export type ShardingDataSourceOptions = RangeShardingDataSourceOptions;
