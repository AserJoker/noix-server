import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { IComplexField, IMixedRecord, IModel } from "../../types/data";
import { Data } from "..";
import { IResolve, ISchema, ResolveFunction, useResolve } from "@noix/resolve";
type Resolver = <T = unknown>(
  schema: ISchema,
  ctx?: Record<string, unknown>
) => Promise<T | null>;

@Provide<Model>("core.system.model", "single", "initialize")
class Model {
  @Inject("#application")
  private app!: Application;

  @Inject("core.system.data")
  private data!: Data;

  private models: IModel[] = [];

  private response: Record<string, Resolver> = {};

  private mixedModel(model: IModel): IModel {
    if (model.extends) {
      const parentModelCode = model.extends;
      const parent = this.getModel(parentModelCode);
      if (parent) {
        const _parent = this.mixedModel(parent);
        return { ...model, fields: { ..._parent.fields, ...model.fields } };
      }
    }
    return model;
  }

  private initModel(model: IModel) {
    this.data.initTable(this.mixedModel(model));
  }

  private scan(filepath: string) {
    const files = fs.readdirSync(filepath);
    const list: string[] = [];
    files.forEach((name) => {
      const fullpath = path.resolve(filepath, name);
      if (fs.statSync(fullpath).isDirectory()) {
        const res = this.scan(fullpath);
        list.push(...res);
      } else {
        list.push(fullpath);
      }
    });
    return list;
  }

  private resolveM2OField(field: IComplexField, record: IMixedRecord) {
    const refModel = this.getModel(field.refModel);
    if (refModel) {
      return async () => {
        const condition: IMixedRecord = {};
        field.refs.forEach((ref, index) => {
          const rel = field.rels[index] as string;
          condition[rel] = record[ref] as string | number | boolean;
        });
        const res = await this.data.queryOne(refModel, condition);
        if (res) {
          return this.resolveModel(refModel, res);
        } else {
          return null;
        }
      };
    } else {
      throw new Error(`cannot load reference model: ${field.refModel}`);
    }
  }
  private resolveO2MField(field: IComplexField, record: IMixedRecord) {
    const refModel = this.getModel(field.refModel);
    if (refModel) {
      return async () => {
        const condition: IMixedRecord = {};
        field.refs.forEach((ref, index) => {
          const rel = field.rels[index] as string;
          condition[rel] = record[ref] as string | number | boolean;
        });
        const res = await this.data.queryList(refModel, condition);
        if (res) {
          return res.map((val) => {
            return this.resolveModel(refModel, val);
          });
        } else {
          return [];
        }
      };
    } else {
      throw new Error(`cannot load reference model: ${field.refModel}`);
    }
  }

  private resolveModel(model: IModel, record?: Record<string, unknown>) {
    const modelResolver: IResolve = {};
    if (record) {
      Object.keys(record).forEach((name) => {
        modelResolver[name] = () => record[name] as string | number | boolean;
      });
      Object.keys(model.fields).forEach((name) => {
        const field = model.fields[name];
        if (typeof field === "object" && field) {
          if (field.type === "m2o") {
            modelResolver[name] = this.resolveM2OField(
              field,
              record as IMixedRecord
            );
          }
          if (field.type === "o2m") {
            modelResolver[name] = this.resolveO2MField(
              field,
              record as IMixedRecord
            );
          }
        }
      });
    }
    modelResolver["insertOne"] = (async ({
      condition,
    }: {
      condition: IMixedRecord;
    }) => {
      const res = await this.data.insertOne(model, condition);
      const resolver = this.resolveModel(model, res);
      return resolver;
    }) as ResolveFunction;
    modelResolver["updateOne"] = (async ({
      condition,
    }: {
      condition: IMixedRecord;
    }) => {
      const res = await this.data.updateOne(model, condition);
      return this.resolveModel(model, res);
    }) as ResolveFunction;
    modelResolver["deleteOne"] = (async ({
      condition,
    }: {
      condition: IMixedRecord;
    }) => {
      const res = await this.data.deleteOne(model, condition);
      return this.resolveModel(model, res);
    }) as ResolveFunction;
    modelResolver["queryOne"] = (async ({
      condition,
    }: {
      condition: IMixedRecord;
    }) => {
      const res = await this.data.queryOne(model, condition);
      if (res) {
        return this.resolveModel(model, res);
      } else {
        return null;
      }
    }) as ResolveFunction;
    modelResolver["queryPage"] = (async ({
      condition,
      offset,
      size,
    }: {
      condition: IMixedRecord;
      offset: number;
      size: number;
    }) => {
      const res = await this.data.queryPage(model, condition, offset, size);
      if (res) {
        const list: IResolve[] = [];
        res.forEach((val, index) => {
          list[index] = this.resolveModel(model, val);
        });
        return list;
      } else {
        return [];
      }
    }) as ResolveFunction;
    return modelResolver;
  }

  public initialize() {
    const modelPath = path.resolve(this.app.getContextPath(), "model");
    const list = this.scan(modelPath);
    this.models = list.map((item) => {
      const real = item.substring(modelPath.length);
      const filelist = real
        .replace(/\\/g, "/")
        .split("/")
        .filter((item) => item);
      const source = fs.readFileSync(item, { encoding: "utf-8" }).toString();
      const model = yaml.load(source) as IModel;
      model.namespace = filelist.splice(0, filelist.length - 1).join(".");
      model.path = item;
      return model;
    });
    this.models.forEach((model) => {
      this.initModel(model);
    });
    this.makeResoponse();
  }
  public getModel(model: string) {
    const path = model.split(".");
    const name = path.splice(path.length - 1, 1)[0] as string;
    const namespace = path.join(".");
    return this.models.find(
      (m) => m.name === name && m.namespace === namespace
    );
  }
  public makeResoponse() {
    const res: Record<string, Record<string, ResolveFunction>> = {};
    this.models.forEach((model) => {
      const namespace = res[model.namespace] || {};
      namespace[model.name] = () => this.resolveModel(model);
      res[model.namespace] = namespace;
    });
    Object.keys(res).forEach((key) => {
      this.response[key] = useResolve(
        () => res[key] as Record<string, ResolveFunction>
      );
    });
  }
  public query(namespace: string) {
    return this.response[namespace];
  }
}
export default Model;
