import { Application } from "./Application";
import "./component";
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
const rootPath = path.resolve(process.cwd(), "demo");
const app = Application.getApplication();
app.resolve(useProviders());
app.loadContext(rootPath);
