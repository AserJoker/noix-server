import { IDataAdapter, IModel, IRecord } from "../../../types/data";
import { createClient } from "redis";
import { Provide } from "../../../decorator/provide.decorator";

@Provide<RedisAdapter>("core.system.redis", "single", "initialize")
class RedisAdapter implements IDataAdapter {
  public async insert(model: IModel, record: IRecord) {
    return record;
  }
  public async update(model: IModel, record: IRecord) {
    return record;
  }
  public async delete(model: IModel, record: IRecord) {
    return record;
  }
  public async query(
    model: IModel,
    record: IRecord,
    offset?: number,
    size?: number
  ) {
    return [];
  }
  public async create(model: IModel) {
    return;
  }
  public async count(model: IModel, record: IRecord) {
    return 0;
  }
  public async createTask() {
    return 0;
  }
  public async endTask(task: number) {
    return;
  }
  public async interraptTask(task: number) {
    return;
  }
  public async initialize() {
    const client = createClient({
      url: "redis://127.0.0.1:6666",
    });
    client.on("error", (err) => {
      console.log(err);
      throw err;
    });
    await client.connect();
  }
}
export default RedisAdapter;
