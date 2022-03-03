import { Logger } from "log4js";
import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import {
  COLUMN_TYPE,
  IColumn,
  IDataAdapter,
  IModel,
  IRecord,
  ITable,
} from "../../types/data";
import path from "path";
import fs from "fs";
interface IFileConfig {
  path: string;
}

@Provide<File>("core.data.file", "single", "initialize")
class File implements IDataAdapter {
  @Inject("#application")
  private app!: Application;
  @Inject("#logger.DATA")
  private logger!: Logger;
  private rootpath = "./data";
  private recordCounter = 0;
  public initialize() {
    const config = this.app.getConfig("file") as IFileConfig;
    const rootpath = path.resolve(this.app.getContextPath(), config.path);
    this.logger.info(`data path:${rootpath}`);
    if (!fs.existsSync(rootpath) || !fs.statSync(rootpath).isDirectory()) {
      fs.mkdirSync(rootpath);
    }
    this.rootpath = rootpath;
  }
  public async create(model: IModel) {
    this.logger.info(`CREATE TABLE ${model.namespace}_${model.name}`);
    const name = `${model.namespace}.${model.name}`.replace(/\./g, "_");
    const filepath = path.resolve(this.rootpath, `${name}.json`);
    if (fs.existsSync(filepath)) {
      fs.rmSync(filepath);
    }
    const table = {} as ITable;
    table.columns = [];
    table.data = [];
    table.name = name;
    table.primary = model.primary;
    table.columns = Object.keys(model.fields)
      .filter((name) => {
        const field = model.fields[name];
        const type = typeof field === "string" ? field : field?.type;
        if (!type) {
          return false;
        }
        if (type) {
          return (
            type !== "o2m" && type !== "m2m" && type !== "o2o" && type !== "m2o"
          );
        }
        return true;
      })
      .map((name): IColumn => {
        const field = model.fields[name];
        const fieldType = typeof field === "string" ? field : field?.type;
        let type: COLUMN_TYPE = "INTEGER";
        switch (fieldType) {
          case "boolean":
          case "integer":
            type = "INTEGER";
            break;
          case "float":
            type = "FLOAT";
            break;
          case "enum":
          case "string":
          case "url":
            type = "VARCHAR(256)";
            break;
          case "text":
            type = "TEXT";
            break;
        }
        return {
          name,
          type,
          notnull: typeof field === "object" && field.required,
        };
      });
    fs.writeFileSync(filepath, JSON.stringify(table));
  }
  public async delete(model: IModel, record: IRecord) {
    this.logger.info(`DELETE ${model.namespace}_${model.name}`);
    const name = `${model.namespace}.${model.name}`.replace(/\./g, "_");
    const filepath = path.resolve(this.rootpath, `${name}.json`);
    const table = JSON.parse(
      fs.readFileSync(filepath, { encoding: "utf-8" }).toString()
    ) as ITable;
    const index = table.data.findIndex((item) => {
      Object.keys(record).reduce((last, now) => {
        return last || item[now] === record[now];
      }, true);
    });
    if (index !== -1) {
      const res = table.data.splice(index, 1);
      fs.writeFileSync(filepath, JSON.stringify(table));
      return res[0] as IRecord;
    }
    return record;
  }
  public async insert(model: IModel, record: IRecord) {
    this.logger.info(`INSERT ${model.namespace}_${model.name}`);
    const name = `${model.namespace}.${model.name}`.replace(/\./g, "_");
    const filepath = path.resolve(this.rootpath, `${name}.json`);
    const table = JSON.parse(
      fs.readFileSync(filepath, { encoding: "utf-8" }).toString()
    ) as ITable;
    const newRecord = { ...record, [model.primary]: `${++this.recordCounter}` };
    table.data.push(newRecord);
    fs.writeFileSync(filepath, JSON.stringify(table));
    return newRecord;
  }
  public async update(model: IModel, record: IRecord) {
    this.logger.info(`UPDATE ${model.namespace}_${model.name}`);
    this.logger.info(`DELETE ${model.namespace}_${model.name}`);
    const name = `${model.namespace}.${model.name}`.replace(/\./g, "_");
    const filepath = path.resolve(this.rootpath, `${name}.json`);
    const table = JSON.parse(
      fs.readFileSync(filepath, { encoding: "utf-8" }).toString()
    ) as ITable;
    const index = table.data.findIndex((item) => {
      Object.keys(record).reduce((last, now) => {
        return last || item[now] === record[now];
      }, true);
    });
    if (index !== -1) {
      const newRecord = { ...table.data[index], ...record };
      table.data[index] = newRecord;
      fs.writeFileSync(filepath, JSON.stringify(table));
      return newRecord;
    }
    return record;
  }
  public async query(model: IModel, record: IRecord) {
    this.logger.info(`QUERY ${model.namespace}_${model.name}`);
    const name = `${model.namespace}.${model.name}`.replace(/\./g, "_");
    const filepath = path.resolve(this.rootpath, `${name}.json`);
    const table = JSON.parse(
      fs.readFileSync(filepath, { encoding: "utf-8" }).toString()
    ) as ITable;
    return table.data.filter((item) => {
      Object.keys(record).reduce((last, now) => {
        return last || item[now] === record[now];
      }, true);
    });
  }
}
export default File;
