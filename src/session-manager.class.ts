import { Debugger, Session } from "inspector";
import { promisify } from "util";
import { v4 } from "uuid";

import { CacheManager, ILocation } from "./cache-amanger.class";
import { Deferred } from "./deffered.class";
import { SourceMapper } from "./mapper.class";

const PREFIX = "__functionLocation__";

export interface ILocateOptions {
  sourceMap?: boolean;
}

export class SessionManager {
  private cache: CacheManager = new CacheManager();
  private session: (Session | undefined);
  private post$;
  private scripts: {
    [scriptId: string]: Debugger.ScriptParsedEventDataType;
  } = {};

  public async clean(): Promise<boolean> {
    if (!this.session) {
      return true;
    }

    await this.post$("Runtime.releaseObjectGroup", {
      objectGroup: PREFIX,
    });

    this.session.disconnect();
    delete global[PREFIX];
    this.session = undefined;
    this.cache.clear();

    return true;
  }

  public async locate(fn: (...args: any) => any, opts?: ILocateOptions): Promise<ILocation> {
    if (typeof fn !== "function") {
      throw new Error("You are allowed only to reference functions.");
    }

    // Look from the function inside the cache array and return it if it does exist.
    const fromCache = await this.cache.get(fn);
    const isMap = opts && opts.sourceMap;

    if (fromCache) {
      return await fromCache.location.promise;
    }

    const deferred = new Deferred<ILocation>();

    // Push a deffered location into the cache
    this.cache.add({ ref: fn, location: deferred });

    // Create a function location object to put referencies into it
    // So that we can easilly access to them
    if (typeof global[PREFIX] === "undefined") {
      global[PREFIX] = {};
    }

    // Create a reference of the function inside the global object
    const uuid = v4();
    global[PREFIX][uuid] = fn;

    // Create an inspector session an enable the debugger inside it
    if (!this.session) {
      this.session = new Session();
      this.post$ = promisify(this.session.post).bind(this.session);
      this.session.connect();
      this.session.on("Debugger.scriptParsed", (res) => {
        this.scripts[res.params.scriptId] = res.params;
      });
      await this.post$("Debugger.enable");
    }

    // Evaluate the expression
    const evaluated = await this.post$("Runtime.evaluate", {
      expression: `global['${PREFIX}']['${uuid}']`,
      objectGroup: PREFIX,
    });

    // Get the function properties
    const properties = await this.post$("Runtime.getProperties", {
      objectId: evaluated.result.objectId,
    });

    const location = properties.internalProperties.find((prop) => prop.name === "[[FunctionLocation]]");
    const script = this.scripts[location.value.value.scriptId];
    let source = script.url;
    const sourceMapUrl = script.sourceMapURL;

    // Normalize the source uri to ensure consistent result
    if (!source.startsWith("file://")) {
      source = `file://${source}`;
    }

    // Construct the result object
    let result: ILocation = {
      column: location.value.value.columnNumber + 1,
      line: location.value.value.lineNumber + 1,
      path: source.substr(7),
      source,
    };

    if (isMap) {
      try {
        const res = await SourceMapper.map(result, sourceMapUrl);
        if (res) {
          result = res;
        }
      } catch (e) {
        // Do nothing
      }
    }

    // Resolve the defered variable
    deferred.resolve(result);

    // return the result
    return result;
  }
}
