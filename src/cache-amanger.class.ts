import { Deferred } from './deffered.class';

export interface ILocation {
  path: string;
  source: string;
  line: number;
  column: number;
  origin?: ILocation;
}

interface ICacheItem {
  ref: (...args: any[]) => any;
  location: Deferred<ILocation>;
}

export class CacheManager {
  public fnCache: ICacheItem[] = [];

  /**
   * Adds a function location to the cache
   * @chainable
   * @param item The item to add
   */
  public add(item: ICacheItem): CacheManager {
    this.fnCache.push(item);
    return this;
  }

  /**
   * Get a function location from its reference
   * @param fn The function reference
   */
  public get(fn: () => any): ICacheItem | undefined {
    return this.fnCache.find((one) => one.ref === fn);
  }

  /**
   * Clear the cache
   * @chainable
   */
  public clear() {
    this.fnCache = [];
    return this;
  }
}
