import { Context, Next } from "koa";
import { Logger } from "log4js";
import { Inject } from "../../../decorator/inject.decorator";
import { Provide } from "../../../decorator/provide.decorator";

@Provide("core.http.middleware.result")
class Result {
  @Inject("#logger.HTTP")
  private logger!: Logger;
  public async exec(ctx: Context, next: Next) {
    if (ctx.method === "POST") {
      try {
        await next();
        ctx.body = {
          data: ctx.body,
          message: ctx.response.message || null,
          success: true,
        };
      } catch (e) {
        const error = e as Error;
        ctx.body = {
          data: null,
          message: error.message,
          success: false,
        };
        this.logger.error(error.stack);
      }
    } else {
      return next();
    }
  }
}
export default Result;
