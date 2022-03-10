/* eslint-disable @typescript-eslint/ban-types */
import { Application } from "../../Application";
import { Inject } from "../../decorator/inject.decorator";
import { Provide } from "../../decorator/provide.decorator";
import { IEventEmitter } from "../../types/event";

@Provide<Event>("core.system.event", "single", "initialize")
class Event {
  @Inject("#application")
  private app!: Application;
  private eventEmitters: Record<
    string | symbol,
    IEventEmitter<Record<string, Function>>
  > = {};
  public initialize() {
    const events = this.app.getConfig("event") as string[];
    events.forEach((name) => {
      const emitter = this.getEventEmitter(name);
      this.app.getContainer().store(`#event.${name}`, emitter);
    });
  }
  public getEventEmitter<
    T extends Record<string, Function> = Record<
      string,
      (...args: unknown[]) => unknown
    >
  >(token: string): IEventEmitter<T> {
    if (this.eventEmitters[token]) {
      return this.eventEmitters[token] as IEventEmitter<T>;
    }
    const callbacks: Record<string, Function[]> = {};
    const on = <E extends keyof T>(event: E, cb: T[E]) => {
      const handles = callbacks[event as string] || [];
      handles.push(cb);
      callbacks[event as string] = handles;
      return () => off(event, cb);
    };
    const off = <E extends keyof T>(event: E, cb?: T[E]) => {
      if (!cb) {
        delete callbacks[event as string];
      } else {
        const handles = callbacks[event as string];
        if (handles) {
          const index = handles.findIndex((h) => h === cb);
          if (index !== -1) {
            handles.splice(index, 1);
          }
        }
      }
    };
    const once = <E extends keyof T>(event: E, cb: T[E]) => {
      const off = on(event, ((...args: unknown[]) => {
        const res = cb(...args);
        off();
        return res;
      }) as Function as T[E]);
    };
    const emit = <E extends keyof T>(event: E, ...args: unknown[]) => {
      const handles = callbacks[event as string];
      if (handles) {
        handles.forEach((h) => h(...args));
      }
    };
    const reset = () => {
      Object.keys(callbacks).forEach((event) => delete callbacks[event]);
    };
    const emitter = {
      on,
      off,
      once,
      emit,
      reset,
    };
    this.eventEmitters[token] = emitter as IEventEmitter<
      Record<string, Function>
    >;
    return emitter;
  }
}
export default Event;
