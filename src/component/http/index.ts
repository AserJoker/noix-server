import { Provide } from "../../decorator/provide.decorator";
import Koa from "koa";
import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import http from "http";
import { getLogger, Logger } from "log4js";
import { IContainer } from "@noix/ioc";
import { IMiddleware } from "../../types/http";

interface IHttpConfig {
  host?: string;
  port?: number;
  middlewares?: string[];
}

@Provide<Http>("core.system.http", "single", "initialize")
class Http {
  @Inject("#application")
  private app!: Application;

  @Inject("#logger.HTTP", getLogger())
  private logger!: Logger;

  @Inject("#container")
  private container!: IContainer;
  private koa: Koa | null = null;
  private server: http.Server | null = null;
  public initialize() {
    const config = this.app.getConfig("http") as IHttpConfig;
    const koa = new Koa();
    const middlewares = config.middlewares || [];
    middlewares.forEach((mid) => {
      const middleware = this.container.inject<IMiddleware>(mid);
      if (middleware) {
        koa.use(middleware.exec.bind(middleware));
      } else {
        this.logger.warn(`cannot find middleware ${mid}`);
      }
    });
    this.koa = koa;
    this.server = http.createServer(koa.callback());
    this.server.listen(config.port, config.host, () => {
      const address = this.server?.address() as {
        address: string;
        port: number;
      };
      this.logger.info(
        `server is running @ http://${address.address}:${address.port}`
      );
    });
  }
  public getKoa() {
    return this.koa;
  }
  public getServer() {
    return this.server;
  }
}
export default Http;
