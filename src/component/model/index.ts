import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { IComplexField, IMixedRecord, IModel } from "../../types/data";
import Data from "../data";
import {
  IResolve,
  ISchema,
  ResolveFunction,
  ResolveValue,
  useResolve,
} from "@noix/resolve";
import { useMixin, IResolver } from "../../decorator/mixin.decorator";
import { BaseModel } from "../../mixin/BaseModel";
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
  private getMixin(model: IModel): Record<string, unknown> | undefined {
    const token = `$mixin.${model.namespace}.${model.name}`;
    const container = this.app.getContainer();
    const mixin = container.inject(token) as IMixedRecord;
    if (mixin) {
      return mixin;
    }
    if (model.extends) {
      const parent = this.models.find(
        (m) => model.extends === `${m.namespace}.${m.name}`
      );
      if (parent) {
        return this.getMixin(parent);
      }
    }
    return;
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

  private resolveM2OField(
    field: IComplexField,
    record: IMixedRecord
  ): ResolveFunction {
    const refModel = this.getModel(field.refModel);
    if (refModel) {
      return async (_arg: unknown, ctx: Record<string, unknown>) => {
        const condition: IMixedRecord = {};
        field.refs.forEach((ref, index) => {
          const rel = field.rels[index] as string;
          condition[rel] = record[ref] as string | number | boolean;
        });
        const mixin = this.getMixin(refModel);
        if (!mixin) {
          throw new Error(`unknown model ${field.refModel}`);
        }
        const queryOne = mixin["queryOne"] as (
          ...args: unknown[]
        ) => Promise<Record<string, unknown>>;
        const res = await queryOne.apply({ ...mixin, ctx, model: refModel }, [
          condition,
        ]);
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
      return async (_arg: unknown, ctx: Record<string, unknown>) => {
        const condition: IMixedRecord = {};
        field.refs.forEach((ref, index) => {
          const rel = field.rels[index] as string;
          condition[rel] = record[ref] as string | number | boolean;
        });
        const mixin = this.getMixin(refModel);
        if (!mixin) {
          throw new Error(`unknown model ${field.refModel}`);
        }
        const queryList = mixin["queryList"] as (
          ...args: unknown[]
        ) => Promise<Record<string, unknown>[]>;
        const res = await queryList.apply({ ...mixin, ctx, model: refModel }, [
          condition,
          0,
          20,
        ]);
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
    const mixin = this.getMixin(model);
    if (mixin) {
      mixin["model"] = model;
      const handles = useMixin(mixin.constructor as typeof BaseModel);
      handles.forEach((handle) => {
        modelResolver[handle.name] = (async (
          arg: Record<string, unknown>,
          ctx: Record<string, unknown>
        ) => {
          const h = mixin[handle.name] as (...args: unknown[]) => unknown;
          const params = handle.params.map((pname) => arg[pname]);
          const res = await h.apply({ ...mixin, ctx }, params);
          return this.resolve(
            res,
            handle.resolver,
            `${model.namespace}.${model.name}`
          );
        }) as ResolveFunction;
      });
    }
    return modelResolver;
  }

  private resolve(
    value: unknown,
    resolver: string | IResolver,
    model: string
  ): ResolveValue {
    if (!value) {
      return null;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((val) =>
        this.resolve(val, resolver, model)
      ) as IResolve[];
    } else if (typeof value === "object") {
      const record = value as IMixedRecord;
      if (resolver === "custom") {
        return this.resolveCustom(record);
      } else {
        if (typeof resolver === "string") {
          const type = resolver === "$currentModel" ? model : resolver;
          const _model = this.models.find(
            (m) => `${m.namespace}.${m.name}` === type
          );
          if (_model) {
            return this.resolveModel(_model, record);
          }
        } else {
          const res: IResolve = {};
          Object.keys(resolver).forEach((key) => {
            const type =
              resolver[key] === "$currentModel" ? model : resolver[key];
            if (type) {
              res[key] = () => this.resolve(record[key], type, model);
            }
          });
          return res;
        }
      }
    }
    return null;
  }
  public resolveCustom(record: IMixedRecord) {
    const res: IResolve = {};
    Object.keys(record).forEach((name) => {
      const value = record[name];
      if (Array.isArray(value)) {
        res[name] = () =>
          value.map((val) => {
            if (typeof val === "object" && val) {
              return this.resolveCustom(val);
            } else {
              return val;
            }
          });
      } else {
        if (typeof value === "object" && value) {
          res[name] = () => this.resolveCustom(value);
        } else {
          res[name] = () => value as string | number | boolean;
        }
      }
    });
    return res;
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
    this.models.push({
      fields: {
        id: {
          type: "string",
          required: true,
          name: "id",
        },
      },
      name: "model",
      namespace: "base",
      path: "inner",
      primary: "id",
      virtual: true,
    });
    this.models.forEach((model) => {
      if (model.store !== false && !model.virtual) {
        this.initModel(model);
      }
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
    this.models
      .filter((mod) => !mod.virtual && mod.store !== false)
      .forEach((model) => {
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
