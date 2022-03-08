#!/usr/bin/env node
import { Application } from "./Application";
import "./component";
import "./mixin";
import { useProviders } from "./decorator/provide.decorator";
import path from "path";
import "./env";
const rootPath = path.resolve(process.cwd());
const app = Application.getApplication();
app.resolve(useProviders());
app.loadContext(rootPath);
