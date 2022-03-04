import { Context, Next } from "koa";
import { Provide } from "../../../decorator/provide.decorator";
import { IMiddleware } from "../../../types/http";

@Provide("core.http.middleware.notfound")
class NotFound implements IMiddleware {
  public async exec(ctx: Context, next: Next) {
    await next();
    if (!ctx.body) {
      ctx.body = "not found";
      ctx.status = 404;
    }
  }
}
export default NotFound;
