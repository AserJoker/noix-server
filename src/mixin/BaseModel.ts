import { IMixedRecord, IModel } from "../types/data";
import Data from "../component/data";
import { Handle, Mixin } from "../decorator/mixin.decorator";
import { Inject } from "../decorator/inject.decorator";
import { IRequestContext } from "../types/http";
import { getLogger, Logger } from "log4js";

@Mixin("base.model")
export class BaseModel {
  @Inject("core.system.data")
  protected data!: Data;

  protected model!: IModel;

  protected ctx!: IRequestContext;

  @Inject("#logger.MODEL", getLogger())
  protected logger!: Logger;

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

  @Handle(["record", "offset", "size"], {
    list: "$currentModel",
    total: "custom",
  })
  public async queryPage(record: IMixedRecord, offset = 0, size = -1) {
    return this.data.queryPage(this.model, record, offset, size);
  }
}
