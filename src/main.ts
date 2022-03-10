#!/usr/bin/env node
import { Application } from "./Application";
import { useProviders } from "./decorator/provide.decorator";
import path from "path";
import "./env";
import "./component";
import "./mixin";
const rootPath = path.resolve(process.cwd());
const app = Application.getApplication();
app.loadMixin();
app.resolve(useProviders());
app.loadContext(rootPath);
app.initComponents();
