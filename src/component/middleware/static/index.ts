import { Context, Next } from "koa";
import { Provide } from "../../../decorator/provide.decorator";
import { IMiddleware } from "../../../types/http";
import { Inject } from "../../../decorator/inject.decorator";
import { Application } from "../../../Application";
import fs from "fs";
import path from "path";
interface IStaticConfig {
  static: string;
  index?: string;
}

@Provide<Static>("core.http.middleware.static", "single", "initialize")
class Static implements IMiddleware {
  @Inject("#application")
  private app!: Application;

  private staticPath = "./";
  private index = "index.html";
  public initialize() {
    const config = this.app.getConfig("http") as IStaticConfig;
    this.staticPath = path.resolve(this.app.getContextPath(), config.static);
    if (config.index) {
      this.index = config.index;
    }
  }
  public exec(ctx: Context, next: Next) {
    if (ctx.method === "GET") {
      const { path: urlPath } = ctx;
      let filename = path.resolve(this.staticPath, `.${urlPath}`);
      if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
        const _path = path.resolve(filename, `${this.index}`);
        if (fs.existsSync(_path) && fs.statSync(_path).isFile()) {
          filename = _path;
        }
      }
      if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
        ctx.body = fs.readFileSync(filename, { encoding: "utf-8" });
      }
    }
    return next();
  }
  public getStaticPath() {
    return this.staticPath;
  }
}
export default Static;
