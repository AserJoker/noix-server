import { Context, Middleware } from "koa";

export interface IMiddleware {
  exec: Middleware;
}
export interface IRequestContext {
  task: number;
  http: Context;
}
