import { Context, Next } from "koa";
import Model from "../../model";
import { Provide } from "../../../decorator/provide.decorator";
import { IMiddleware } from "../../../types/http";
import { Inject } from "../../../decorator/inject.decorator";
import { ISchema } from "@noix/resolve";
import DataComponent from "../../data";
@Provide<Data>("core.http.middleware.data", "single", "initialize")
class Data implements IMiddleware {
  @Inject("core.system.model")
  private model!: Model;
  @Inject("core.system.data")
  private data!: DataComponent;
  public async exec(ctx: Context, next: Next) {
    if (ctx.method === "POST") {
      const namespace = ctx.path
        .split("/")
        .filter((item) => item)
        .join(".");
      const resolver = this.model.query(namespace);
      if (!resolver) {
        throw new Error(`cannot resolve namespace ${namespace}`);
      }
      const task = await this.data.adapter.createTask();
      try {
        ctx.body = await resolver(
          JSON.parse(ctx.request.body?.toString() as string) as ISchema,
          { task, http: ctx }
        );
        await this.data.adapter.endTask(task);
      } catch (e) {
        await this.data.adapter.interraptTask(task);
        throw e;
      }
    }
    return next();
  }
  public initialize() {
    return;
  }
}
export default Data;
