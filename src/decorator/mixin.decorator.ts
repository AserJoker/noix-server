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
  return <T extends BaseModel = BaseModel>(target: T, name: string) => {
    const classObject = target.constructor as typeof BaseModel;
    const _handles = handles.get(classObject) || ([] as IHandle[]);
    _handles.push({
      params,
      name,
      resolver: resolver || "custom",
    });
    handles.set(classObject, _handles);
  };
};
export const useMixin = (classObject: typeof BaseModel) => {
  return handles.get(classObject) || [];
};
