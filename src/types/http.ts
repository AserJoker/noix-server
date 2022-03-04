import { Middleware } from "koa";

export interface IMiddleware {
  exec: Middleware;
}
