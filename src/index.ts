import { SessionManager } from "./session-manager.class";

const s = new SessionManager();

export function locate(fn: (...args: any[]) => any): Promise<any> {
  return s.locate(fn);
}

export function clean() {
  return s.clean();
}
