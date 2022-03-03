/* eslint-disable @typescript-eslint/ban-types */
import { IProvideClass } from "@noix/ioc";
const values = new Map<IProvideClass<unknown>, Record<string, unknown>>();
const injections = new Map<
  IProvideClass<unknown>,
  Record<string, string | symbol>
>();
export const Inject = (token: string | symbol, defaultValue?: unknown) => {
  return <T extends Object>(target: T, name: string) => {
    const classObject = target.constructor as IProvideClass<unknown>;
    const _values = values.get(classObject) || {};
    _values[name] = defaultValue;
    values.set(classObject, _values);
    const _injections = injections.get(classObject) || {};
    _injections[name] = token;
    injections.set(classObject, _injections);
  };
};
export const useInjection = <T = unknown>(classObject: IProvideClass<T>) => {
  const _values = values.get(classObject) || {};
  const _injections = injections.get(classObject) || {};
  return { values: _values, injections: _injections };
};
