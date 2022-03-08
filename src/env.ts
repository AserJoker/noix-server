declare module "koa" {
  interface Request {
    body?: Buffer;
  }
  interface Response {
    msg?: string;
  }
}
export {};
