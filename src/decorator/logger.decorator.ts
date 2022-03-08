import { getLogger } from "log4js";
import { Inject } from "./inject.decorator";

export const InjectLogger = (token: string) =>
  Inject(`#logger.${token}`, getLogger());
