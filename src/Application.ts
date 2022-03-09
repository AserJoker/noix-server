import { IContainer, IProvideClass, useContainer } from "@noix/ioc";
import { IProvideInfo } from "./decorator/provide.decorator";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
interface IComponent {
  name: string;
  dependencies: (string | IComponent)[];
}
interface IContext {
  components: (string | IComponent)[];
  config: Record<string, unknown>;
}
export class Application {
  private static _theApp: Application | null = null;

  public static getApplication() {
    if (!Application._theApp) {
      Application._theApp = new Application();
    }
    return Application._theApp;
  }

  private _container: IContainer;
  private _config: Record<string, unknown> = {};
  private _components: (string | IComponent)[] = [];
  private _contextPath: string = process.cwd();

  private constructor() {
    this._container = useContainer();
    this._container.store("#application", this);
  }

  private resolveContext(type: string, source: string) {
    if (type === ".yml" || type === ".yaml") {
      return yaml.load(source) as IContext;
    }
    return {
      config: {},
      components: [],
    } as IContext;
  }

  public getContainer(): IContainer {
    return this._container;
  }
  public resolve(providers: IProvideInfo[]) {
    const container = this._container;
    providers.forEach(({ token, ...provider }) => {
      container.provide(
        token,
        provider.provider as IProvideClass<Record<string, unknown>>,
        provider.scope,
        provider.injections,
        provider.values,
        provider.initialize
      );
    });
  }
  public loadContext(contextPath: string) {
    this._contextPath = contextPath;
    const result = fs.readdirSync(contextPath);
    const contextFile = result.find((r) => {
      const filenamePath = r.split(".");
      if (filenamePath.length >= 2) {
        filenamePath.splice(filenamePath.length - 1, 1);
        const filename = filenamePath.join(".");
        if (filename === "context") {
          return true;
        }
      }
      return false;
    });
    if (!contextFile) {
      throw new Error(
        `cannot load context file:${path.resolve(
          contextPath,
          "context.yml|yaml|json|xml"
        )}`
      );
    }
    const contextSource = fs
      .readFileSync(path.resolve(contextPath, contextFile), {
        encoding: "utf-8",
      })
      .toString();
    const context = this.resolveContext(
      path.extname(contextFile),
      contextSource
    );
    this._config = context.config || {};
    this._components = context.components || [];
  }
  public initComponents() {
    const cache: string[] = [];
    const loadComponent = (comp: string | IComponent) => {
      if (typeof comp === "string") {
        if (!cache.includes(comp)) {
          this.getContainer().inject(comp);
          cache.push(comp);
        }
      } else {
        const { name, dependencies } = comp;
        if (!cache.includes(name)) {
          dependencies.forEach((dep) => {
            loadComponent(dep);
          });
          this.getContainer().inject(name);
          cache.push(name);
        }
      }
    };
    this._components.forEach((comp) => {
      loadComponent(comp);
    });
  }
  public getConfig(name?: string): unknown {
    return name ? this._config[name] || {} : this._config;
  }
  public getContextPath() {
    return this._contextPath;
  }
  public loadMixin() {
    const mixin = path.resolve(this._contextPath, "mixin");
    const isMixinModule = (mixinPath: string) => {
      if (fs.statSync(mixinPath).isFile()) {
        if (path.extname(mixinPath) === ".js") {
          return true;
        }
      } else {
        if (fs.statSync(mixinPath).isDirectory()) {
          if (fs.existsSync(path.resolve(mixinPath, "package.json"))) {
            return true;
          }
        }
      }
      return false;
    };
    if (fs.existsSync(mixin) && fs.statSync(mixin).isDirectory()) {
      const list = fs.readdirSync(mixin);
      list.forEach((name) => {
        const mixinPath = path.resolve(mixin, name);
        if (isMixinModule(mixinPath)) {
          let install: null | ((app: Application) => void) = null;
          try {
            install = require(mixinPath).default as (app: Application) => void;
          } catch (e) {
            // ;
          }
          if (typeof install === "function") {
            install(this);
          }
        }
      });
    }
  }
  public get version() {
    const pkg = fs
      .readFileSync(path.resolve(__dirname, "../package.json"))
      .toString();
    const json = JSON.parse(pkg) as { version: string };
    const [major, minor, patch] = json.version.split(".");
    return { major, minor, patch };
  }
}
