import { Provide } from "../../decorator/provide.decorator";
import log4js, { Configuration } from "log4js";
import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { IContainer } from "@noix/ioc";

@Provide<Logger>("core.system.logger", "single", "initialize")
class Logger {
  @Inject("#application")
  private _app: Application | null = null;
  private get app() {
    if (!this._app) {
      throw new Error("invalid object contruct");
    }
    return this._app;
  }
  @Inject("#container")
  private _container: IContainer | null = null;
  private get container() {
    if (!this._container) {
      throw new Error("invalid object contruct");
    }
    return this._container;
  }
  public initialize() {
    const config = this.app.getConfig("logger") as Record<string, unknown>;
    const keys = Object.keys(config);
    const loggerConfig = {} as Configuration;
    loggerConfig.appenders = {};
    loggerConfig.categories = {};
    keys.forEach((key) => {
      const value = config[key] as {
        level: string;
        appenders: ({ type: string } & Record<string, string>)[];
      };
      if (!value.appenders) {
        throw new Error(`config error: logger '${key}' hasn't appender `);
      }
      value.appenders.forEach((appender) => {
        loggerConfig.appenders[`${key}-${appender.type}`] = appender;
      });
      loggerConfig.categories[key] = {
        appenders: value.appenders.map((appender) => `${key}-${appender.type}`),
        level: value.level,
      };
    });
    log4js.configure(loggerConfig);
    keys.forEach((key) => {
      this.container.store(`#logger.${key}`, log4js.getLogger(key));
    });
  }
}
export default Logger;
