import { Context, Next } from "koa";
import { Provide } from "../../../decorator/provide.decorator";
@Provide<BodyParser>("core.http.middleware.bodyparser")
class BodyParser {
  private parsePost(ctx: Context) {
    return new Promise<Buffer>((resolve, reject) => {
      let data = Buffer.from([]);
      ctx.req.on("data", (chunk: Buffer) => {
        const base = data.length;
        const newBuffer = Buffer.from(
          new ArrayBuffer(data.length + chunk.length)
        );
        data.forEach((val, index) => {
          newBuffer.writeUint8(val, index);
        });
        chunk.forEach((val, index) => {
          newBuffer.writeUInt8(val, base + index);
        });
        data = newBuffer;
      });
      ctx.req.on("end", () => {
        resolve(data);
      });
      ctx.req.on("error", (e) => {
        reject(e);
      });
    });
  }
  public async exec(ctx: Context, next: Next) {
    if (ctx.method === "POST") {
      ctx.request.body = await this.parsePost(ctx);
    }
    return next();
  }
}
export default BodyParser;
