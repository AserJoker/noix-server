import { Mixin } from "../decorator/mixin.decorator";
import { BaseModel } from "./BaseModel";

@Mixin("permission.user")
export class PermissionUser extends BaseModel {}
