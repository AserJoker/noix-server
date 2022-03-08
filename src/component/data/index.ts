import { Logger } from "log4js";
import Model from "../model";
import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import {
  FIELD_TYPE,
  IComplexField,
  IDataAdapter,
  IField,
  IMixedRecord,
  IModel,
  IRecord,
} from "../../types/data";
interface IDataConfig extends Record<string, unknown> {
  adapter: string;
}
@Provide<Data>("core.system.data", "single", "initialize")
class Data {
  @Inject("#application")
  private app!: Application;

  @Inject("#logger.DATA")
  private logger!: Logger;

  @Inject("core.system.model")
  private model!: Model;

  private _adapter: IDataAdapter | null = null;
  public get adapter(): IDataAdapter {
    if (!this._adapter) {
      throw new Error("cannot find data adapter");
    }
    return this._adapter;
  }
  private filterField(
    model: IModel,
    mixedrecord: IMixedRecord,
    fieldType: FIELD_TYPE
  ) {
    const fields = Object.keys(model.fields)
      .filter((name) => {
        const field = model.fields[name];
        if (field && typeof field !== "string") {
          if (field.type === fieldType && mixedrecord[name]) {
            return true;
          }
        }
        return false;
      })
      .map((name) => {
        const field = model.fields[name];
        if (typeof field === "object" && field) {
          return { ...field, name };
        }
        return null;
      })
      .filter((f) => f !== null) as IField[];
    return fields;
  }
  private async insertOrUpdateM2O(
    field: IComplexField,
    mixedrecord: IMixedRecord
  ) {
    const value = mixedrecord[field.name] as IMixedRecord;
    const refModel = this.model.getModel(field.refModel);
    if (refModel) {
      const res = (await this.insertOrUpdateOne(
        refModel,
        value
      )) as IMixedRecord;
      mixedrecord[field.name] = res;
      field.refs.forEach((ref, index) => {
        const rel = field.rels[index] as string;
        mixedrecord[ref] = res[rel];
      });
    } else {
      throw new Error(`cannot load reference model ${field.refModel}`);
    }
  }
  private async insertOrUpdateO2M(
    field: IComplexField,
    mixedrecord: IMixedRecord
  ) {
    const value = mixedrecord[field.name] as IMixedRecord[];
    const refModel = this.model.getModel(field.refModel);
    if (refModel) {
      await Promise.all(
        value.map(async (rec, index) => {
          field.refs.forEach((ref, index) => {
            const rel = field.rels[index] as string;
            rec[rel] = mixedrecord[ref];
          });
          value[index] = await this.insertOrUpdateOne(refModel, rec);
        })
      );
    } else {
      throw new Error(`cannot load reference model ${field.refModel}`);
    }
  }
  public initialize() {
    const config = this.app.getConfig("data") as IDataConfig;
    const { adapter } = config;
    this.logger.info(`using ${adapter}`);
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
  public async insertOrUpdateOne(model: IModel, mixedrecord: IMixedRecord) {
    if (mixedrecord[model.primary]) {
      return this.updateOne(model, mixedrecord);
    } else {
      return this.insertOne(model, mixedrecord);
    }
  }
  public async updateOne(model: IModel, mixedrecord: IMixedRecord) {
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
    const m2oField = this.filterField(
      model,
      mixedrecord,
      "m2o"
    ) as IComplexField[];
    const o2mField = this.filterField(
      model,
      mixedrecord,
      "o2m"
    ) as IComplexField[];
    await Promise.all(
      m2oField.map(async (field) => {
        return this.insertOrUpdateM2O(field, mixedrecord);
      })
    );
    await Promise.all(
      o2mField.map(async (field) => {
        return this.insertOrUpdateO2M(field, mixedrecord);
      })
    );
    const res = await this.adapter.update(model, record);
    return { ...mixedrecord, ...res };
  }
  public async insertOne(model: IModel, mixedrecord: IMixedRecord) {
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
    const m2oField = this.filterField(
      model,
      mixedrecord,
      "m2o"
    ) as IComplexField[];
    const o2mField = this.filterField(
      model,
      mixedrecord,
      "o2m"
    ) as IComplexField[];
    await Promise.all(
      m2oField.map(async (field) => {
        return this.insertOrUpdateM2O(field, mixedrecord);
      })
    );
    const res = await this.adapter.insert(model, record);
    const mixedResult = { ...mixedrecord, ...res };
    await Promise.all(
      o2mField.map(async (field) => {
        return this.insertOrUpdateO2M(field, mixedResult);
      })
    );
    return mixedResult;
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
  public async queryPage(
    model: IModel,
    mixedrecord: IMixedRecord,
    offset: number,
    size: number
  ) {
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
    const list = await this.adapter.query(model, record, offset, size);
    const total = await this.adapter.count(model);
    return { list, total };
  }
  public initTable(model: IModel) {
    return this.adapter.create(model);
  }
}
export default Data;
