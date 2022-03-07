import fs from "fs";
import path from "path";
import { transpileModule, readConfigFile } from "typescript";
const rootPath = path.resolve(process.cwd(), "src");
const list: string[] = [];
const scan = (_path: string) => {
  const _list = fs.readdirSync(_path);
  _list.forEach((name) => {
    const fullpath = path.resolve(_path, name);
    const state = fs.statSync(fullpath);
    if (state.isDirectory()) {
      scan(fullpath);
    } else if (state.isFile()) {
      if (path.extname(fullpath) === ".ts" && !fullpath.endsWith(".d.ts")) {
        list.push(fullpath);
      }
    }
  });
};
scan(rootPath);
const config = readConfigFile(
  path.resolve(process.cwd(), "tsconfig.json"),
  (_path) => fs.readFileSync(_path).toString()
).config;
const modules: Record<string, string> = {};
list.forEach((_path) => {
  const source = fs.readFileSync(_path).toString();
  const output = transpileModule(source, config).outputText;
  if (output) {
    modules[_path] = `()=>{
        const require = (_path)=>{
            if(cache[_path]){
                return cache[_path];
            }
            const root = '${path.dirname(_path)}';
            if(_path.startsWith('/')){
                const module = modules[_path]||modules[_path+'.ts']||modules[_path+"/index.ts"];
                const m =  module();
                cache[_path] = m;
                return m;
            }else{
                const fullPath = path.resolve(root,_path);
                if(cache[fullPath]){
                    return cache[fullPath]
                }
                const module = modules[fullPath]||modules[fullPath+'.ts']||modules[fullPath+'/index.ts'];
                const m =  module?module():_require(_path);
                cache[fullPath] = m;
                return m;
            }
        }
       const exports = {};
       ${output}
       return exports;
    }`;
  }
});
const result = `
const _require = (path)=> require(path);
const path = require('path');
const cache = {};
const modules = {
    ${Object.keys(modules).map((path) => {
      const source = modules[path];
      return `
        "${path}":${source}
    `;
    })}
}
modules["/Users/qingfeng/Projects/noix/packages/server/src/main.ts"]();`;
fs.writeFileSync("bin/main.js", result);
