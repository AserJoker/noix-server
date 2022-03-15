import { Application } from "../../../Application";
import { Inject } from "../../../decorator/inject.decorator";
import { Provide } from "../../../decorator/provide.decorator";
import { IDataAdapter, IField, IModel, IRecord } from "../../../types/data";
import mysql2, { Pool } from "mysql2/promise";

interface IMysqlAdapterConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

@Provide<MysqlAdapter>("core.system.mysql", "single", "initialize")
class MysqlAdapter implements IDataAdapter {
  @Inject("#application")
  protected app!: Application;

  protected pool?: Pool;

  protected config?: IMysqlAdapterConfig;

  protected resoleColumns(field: IField) {
    console.log(field);
    return "";
  }

  public async insert(model: IModel, record: IRecord) {
    return record;
  }
  public async update(model: IModel, record: IRecord) {
    return record;
  }
  public async delete(model: IModel, record: IRecord) {
    return record;
  }
  public async query(
    model: IModel,
    record: IRecord,
    offset?: number,
    size?: number
  ) {
    return [];
  }
  public async create(model: IModel) {
    if (this.pool) {
      const connect = await this.pool.getConnection().catch((e) => {
        throw e;
      });
      const cols = Object.keys(model.fields).map((name) => {
        const field = model.fields[name] as IField;
        return this.resoleColumns(field);
      });
      console.log(cols);
      // await connect.query(
      //   `create table ${model.namespace}_${model.name}(${cols.join(",")})`
      // );
      connect.release();
    }
  }
  public async count(model: IModel, record: IRecord) {
    return 0;
  }
  public async createTask() {
    return 0;
  }
  public async endTask(task: number) {
    return;
  }
  public async interraptTask(task: number) {
    return;
  }
  public async initialize() {
    const config = this.app.getConfig("mysql") as IMysqlAdapterConfig;
    const pool = mysql2.createPool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
    });
    this.config = config;
    this.pool = pool;
  }
}
export default MysqlAdapter;
