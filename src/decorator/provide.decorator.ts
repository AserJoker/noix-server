import { IProvide, IProvideClass, Scope } from "@noix/ioc";
import { useInjection } from "./inject.decorator";
export interface IProvideInfo extends IProvide<unknown> {
  token: string | symbol;
}
const providers: IProvideInfo[] = [];
const provide = (token: string | symbol, provider: IProvide<unknown>) => {
  providers.push({ token, ...provider });
};
function Provide<T, K extends IProvideClass<T>>(target: K): void;
function Provide<T>(
  token: string | symbol,
  scope?: Scope,
  initialize?: keyof InstanceType<{ new (): T }>
): <K extends IProvideClass<T>>(target: K) => void;
function Provide(...args: unknown[]) {
  if (typeof args[0] === "string") {
    const [token, scope = "single", initialize] = args as [
      string | symbol,
      Scope,
      string
    ];
    return <T, K extends IProvideClass<T>>(target: K) => {
      const { injections, values } = useInjection(target);
      provide(token, {
        provider: target,
        scope,
        values,
        injections,
        initialize,
      });
    };
  }
  const target = args[0] as IProvideClass<unknown>;
  const { injections, values } = useInjection(target);
  provide(target.name, {
    provider: target,
    scope: "single",
    values,
    injections,
  });
  return;
}
const useProviders = () => providers;
export { Provide, useProviders };
