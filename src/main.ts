import { Application } from "./Application";
import "./component";
import { useProviders } from "./decorator/provide.decorator";
import path from "path";
const rootPath = path.resolve(process.cwd(), "demo");
const app = Application.getApplication();
app.resolve(useProviders());
app.loadContext(rootPath);
