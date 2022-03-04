import { Logger } from "log4js";
import { Application } from "../../../Application";
import { Inject } from "../../../decorator/inject.decorator";
import { Provide } from "../../../decorator/provide.decorator";
import { IDataAdapter, IModel, IRecord } from "../../../types/data";
interface IMysqlConfig extends Record<string, unknown> {
  username: string;
  password: string;
  host: string;
  port: number;
}
@Provide<Mysql>("core.data.mysql", "single", "initialize")
class Mysql implements IDataAdapter {
  @Inject("#application")
  private app!: Application;
  @Inject("#logger.DATA")
  private logger!: Logger;
  public initialize() {
    const config = this.app.getConfig("mysql") as IMysqlConfig;
    this.logger.info(config.host);
  }
  public async create(model: IModel) {
    this.logger.info(`CREATE TABLE ${model.namespace}_${model.name}`);
  }
  public async delete(model: IModel, record: IRecord) {
    this.logger.info(`DELETE ${model.namespace}_${model.name}`);
    return record;
  }
  public async insert(model: IModel, record: IRecord) {
    this.logger.info(`INSERT ${model.namespace}_${model.name}`);
    return record;
  }
  public async update(model: IModel, record: IRecord) {
    this.logger.info(`UPDATE ${model.namespace}_${model.name}`);
    return record;
  }
  public async query(model: IModel, record: IRecord) {
    this.logger.info(`QUERY ${model.namespace}_${model.name}`);
    return [record];
  }
}
export default Mysql;
