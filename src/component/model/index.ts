import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { IModel } from "../../types/data";
import { Data } from "..";

@Provide<Model>("core.system.model", "single", "initialize")
class Model {
  @Inject("#application")
  private app!: Application;

  @Inject("core.system.data")
  private data!: Data;

  private models: IModel[] = [];

  private mixedModel(model: IModel): IModel {
    if (model.extends) {
      const parentModelCode = model.extends;
      const namespaceList = parentModelCode.split(".");
      const name = namespaceList.splice(
        namespaceList.length - 1,
        1
      )[0] as string;
      const namespace = namespaceList.join(".");
      const parent = this.getModel(name, namespace);
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
  }
  public getModel(name: string, namespace: string) {
    return this.models.find(
      (m) => m.name === name && m.namespace === namespace
    );
  }
}
export default Model;
