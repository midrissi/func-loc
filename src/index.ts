import { ILocation } from './cache-amanger.class';
import { ILocateOptions, SessionManager } from './session-manager.class';

const s = new SessionManager();

export function locate(fn: (...args: any[]) => any, opts?: ILocateOptions): Promise<ILocation> {
  return s.locate(fn, opts);
}

export function clean() {
  return s.clean();
}
