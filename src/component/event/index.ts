import { Logger } from "log4js";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";

@Provide<Event>("core.system.event", "single", "initialize")
class Event {
  @Inject("#logger.EVENT")
  private logger!: Logger;
  public initialize() {
    this.logger.debug("Initialize");
  }
}
export default Event;
