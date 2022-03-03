import { Logger } from "log4js";
import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import { IDataAdapter, IMixedRecord, IModel, IRecord } from "../../types/data";
interface IDataConfig extends Record<string, unknown> {
  adapter: string;
}
@Provide<Data>("core.system.data", "single", "initialize")
class Data {
  @Inject("#application")
  private app!: Application;

  @Inject("#logger.DATA")
  private logger!: Logger;

  private _adapter: IDataAdapter | null = null;
  public get adapter(): IDataAdapter {
    if (!this._adapter) {
      throw new Error("cannot find data adapter");
    }
    return this._adapter;
  }
  public initialize() {
    const config = this.app.getConfig("data") as IDataConfig;
    const { adapter } = config;
    this.logger.info(`USING DATA ADAPTER: ${adapter}`);
    this._adapter = this.app.getContainer().inject<IDataAdapter>(adapter);
    if (!this._adapter) {
      throw new Error(`failed get adapter: ${adapter}`);
    }
  }
  public async queryOne(model: IModel, mixedrecord: IMixedRecord) {
    const record: IRecord = {};
    Object.keys(mixedrecord).forEach((key) => {
      const value = mixedrecord[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        record[key] = value;
      }
    });
    const list = await this.adapter.query(model, record);
    return list[0] || null;
  }
  public updateOne(model: IModel, mixedrecord: IMixedRecord) {
    const record: IRecord = {};
    Object.keys(mixedrecord).forEach((key) => {
      const value = mixedrecord[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        record[key] = value;
      }
    });
    return this.adapter.update(model, record);
  }
  public insertOne(model: IModel, mixedrecord: IMixedRecord) {
    const record: IRecord = {};
    Object.keys(mixedrecord).forEach((key) => {
      const value = mixedrecord[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        record[key] = value;
      }
    });
    return this.adapter.insert(model, record);
  }
  public deleteOne(model: IModel, mixedrecord: IMixedRecord) {
    const record: IRecord = {};
    Object.keys(mixedrecord).forEach((key) => {
      const value = mixedrecord[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        record[key] = value;
      }
    });
    return this.adapter.delete(model, record);
  }
  public queryList(model: IModel, mixedrecord: IMixedRecord) {
    const record: IRecord = {};
    Object.keys(mixedrecord).forEach((key) => {
      const value = mixedrecord[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        record[key] = value;
      }
    });
    return this.adapter.query(model, record);
  }
  public initTable(model: IModel) {
    return this.adapter.create(model);
  }
}
export default Data;
