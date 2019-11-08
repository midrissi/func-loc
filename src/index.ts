import { SessionManager } from "./session-manager.class";
import { ILocation } from "./cache-amanger.class";

const s = new SessionManager();

export function locate(fn: (...args: any[]) => any): Promise<ILocation> {
  return s.locate(fn);
}

export function clean() {
  return s.clean();
}
