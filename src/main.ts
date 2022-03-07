#!/usr/bin/env node
import { Application } from "./Application";
import "./component";
import "./mixin";
import { useProviders } from "./decorator/provide.decorator";
import path from "path";
declare module "koa" {
  interface Request {
    body?: Buffer;
  }
  interface Response {
    message?: string;
  }
}
const rootPath = path.resolve(process.cwd());
const app = Application.getApplication();
app.resolve(useProviders());
app.loadContext(rootPath);
