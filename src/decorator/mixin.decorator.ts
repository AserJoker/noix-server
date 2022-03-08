/* eslint-disable @typescript-eslint/ban-types */
import { Provide } from "./provide.decorator";
import { BaseModel } from "../mixin/BaseModel";
export interface IResolver {
  [key: string]: IResolver | string;
}
interface IHandle {
  name: string;
  resolver: string | IResolver;
  params: string[];
}
const handles = new Map<typeof BaseModel, IHandle[]>();
export const Mixin = (token: string) => {
  return <T extends typeof BaseModel = typeof BaseModel>(target: T) => {
    Provide(`$mixin.${token}`, "proto")(target);
  };
};
export const Handle = (
  params: string[] = [],
  resolver?: string | IResolver
) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return <T extends BaseModel = BaseModel, K extends Function = Function>(
    target: T,
    name: string,
    descript: TypedPropertyDescriptor<K>
  ) => {
    const classObject = target.constructor as typeof BaseModel;
    const _handles = handles.get(classObject) || ([] as IHandle[]);
    _handles.push({
      params,
      name,
      resolver: resolver || "custom",
    });
    const handle = descript.value as Function;
    descript.value = function (this: T, ...args: unknown[]) {
      const res = handle.apply(this, args);
      Promise.resolve(res).then((value) => {
        this.logger.debug(
          `call ${this.model.namespace}.${this.model.name}.${name}
           input:${JSON.stringify(args)}
           output:${JSON.stringify(value)}`
        );
      });
      return res;
    } as Function as K;
    handles.set(classObject, _handles);
  };
};
export const useMixin = (classObject: typeof BaseModel) => {
  let list: IHandle[] = [];
  let co = classObject;
  while (co) {
    const _handles = handles.get(co) || [];
    list = [..._handles, ...list];
    co = Object.getPrototypeOf(co);
  }
  return list;
};
