import {
  IWrenEngineAdaptor,
} from '../adaptors/wrenEngineAdaptor';
import { CompactTable } from './connector';
import { IConnector } from './connector';
import { getLogger } from '@server/utils';

const logger = getLogger('CouchbaseConnector');
logger.level = 'debug';

export interface CouchbasePrepareOptions {
  initSql: string;
}

export interface CouchbaseListTableOptions {
  format?: boolean;
}

export interface CouchbaseColumnResponse {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  is_nullable: boolean;
  data_type: string;
}

export class CouchbaseConnector
  implements IConnector<CouchbaseColumnResponse[], any[]>
{
  private wrenEngineAdaptor: IWrenEngineAdaptor;
  constructor({
    wrenEngineAdaptor,
  }: {
    wrenEngineAdaptor: IWrenEngineAdaptor;
  }) {
    this.wrenEngineAdaptor = wrenEngineAdaptor;
  }
  public async prepare(prepareOptions: CouchbasePrepareOptions): Promise<void> {
    const { initSql } = prepareOptions;
    await this.wrenEngineAdaptor.initDatabase(initSql);
  }

  public async connect(): Promise<string> {
    const sql = 'SELECT 1;';
    try {
      await this.wrenEngineAdaptor.queryCouchbase(sql);
      return `'true'`;
    } catch (_err) {
      return _err.message;
    }
  }

  public async listTables(listTableOptions: CouchbaseListTableOptions) {
    const response = await this.wrenEngineAdaptor.queryCouchbaseSchema();
    if (listTableOptions.format) {
      return this.formatToCompactTable(response);
    }
  }

  public async listConstraints(): Promise<any[]> {
    return [];
  }

  private formatToCompactTable(
    columns: CouchbaseColumnResponse[],
  ): CompactTable[] {
    return columns.reduce(
      (acc: CompactTable[], row: CouchbaseColumnResponse) => {
        const {
          table_catalog,
          table_schema,
          table_name,
          column_name,
          is_nullable,
          data_type,
        } = row;
        const tableName = this.formatCompactTableName(table_name, table_schema);
        let table = acc.find((t) => t.name === tableName);
        if (!table) {
          table = {
            name: tableName,
            description: '',
            columns: [],
            properties: {
              schema: table_schema,
              catalog: table_catalog,
            },
          };
          acc.push(table);
        }
        table.columns.push({
          name: column_name,
          type: data_type,
          notNull: is_nullable,
          description: '',
          properties: {},
        });
        return acc;
      },
      [],
    );
  }

  public formatCompactTableName(tableName: string, schema: string) {
    return `${schema}.${tableName}`;
  }
}
