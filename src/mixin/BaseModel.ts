import { IMixedRecord, IModel } from "..";
import Data from "../component/data";
import { Handle, Mixin } from "../decorator/mixin.decorator";
import { Inject } from "../decorator/inject.decorator";

@Mixin("base.model")
export class BaseModel {
  @Inject("core.system.data")
  private data!: Data;

  private model!: IModel;

  @Handle(["record"], "$currentModel")
  public insertOne(record: IMixedRecord) {
    return this.data.insertOne(this.model, record);
  }

  @Handle(["record"], "$currentModel")
  public updateOne(record: IMixedRecord) {
    return this.data.updateOne(this.model, record);
  }

  @Handle(["record"], "$currentModel")
  public deleteOne(record: IMixedRecord) {
    return this.data.deleteOne(this.model, record);
  }

  @Handle(["record"], "$currentModel")
  public queryOne(record: IMixedRecord) {
    return this.data.queryOne(this.model, record);
  }

  @Handle(["record"], "$currentModel")
  public queryList(record: IMixedRecord) {
    return this.data.queryList(this.model, record);
  }

  @Handle(["record", "offset", "size"], "$currentModel")
  public queryPage(record: IMixedRecord, offset = 0, size = -1) {
    return this.data.queryPage(this.model, record, offset, size);
  }
}
