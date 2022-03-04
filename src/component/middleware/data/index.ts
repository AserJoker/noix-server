import { Context, Next } from "koa";
import { Provide } from "../../../decorator/provide.decorator";
import { IMiddleware } from "../../../types/http";
@Provide<Data>("core.http.middleware.data", "single", "initialize")
class Data implements IMiddleware {
  public async exec(ctx: Context, next: Next) {
    if (ctx.method === "POST") {
      throw new Error("demo error");
      ctx.body = {};
    }
    return next();
  }
  public initialize() {
    return;
  }
}
export default Data;
