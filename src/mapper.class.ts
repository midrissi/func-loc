import { readFile } from 'fs';
import { resolve } from 'path';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import { promisify } from 'util';
import parseDataURL from 'data-urls';

import { ILocation } from './cache-amanger.class';
import { Deferred } from './deffered.class';

const readFile$ = promisify(readFile);
const REGEX = /\/\/# sourceMappingURL=(.*\.map)$/m;

require.extensions['.map'] = require.extensions['.json'];

interface IFileMap {
  content: string;
  sourceMap?: RawSourceMap;
  sourceMapPath?: string;
  consumer?: SourceMapConsumer;
}

const cache: {
  [fileName: string]: Deferred<IFileMap> | undefined;
} = {};

export class SourceMapper {
  public static normalizePath(p: string): string {
    let pathName = resolve(p).replace(/\\/g, '/');

    // Windows drive letter must be prefixed with a slash
    if (pathName[0] !== '/') {
      pathName = `/${pathName}`;
    }

    return pathName;
  }

  public static async map(location: ILocation, sourceMapUrl?: string): Promise<ILocation> {
    const { consumer, sourceMapPath } = await this.getSrcMap(location, sourceMapUrl);

    const mappedLocation = consumer.originalPositionFor({
      column: location.column,
      line: location.line,
    });

    if (!mappedLocation || !mappedLocation.column || !mappedLocation.line) {
      return location;
    }

    const path = this.normalizePath(resolve(sourceMapPath, '..', mappedLocation.source));

    return {
      column: mappedLocation.column,
      line: mappedLocation.line,
      origin: location,
      path,
      source: `file://${path}`,
    };
  }

  private static getPlatformPath(path: string): string {
    const exec = /^\/(\w*):(.*)/.exec(path);

    return /^win/.test(process.platform) && exec ? `${exec[1]}:\\${exec[2].replace(/\//g, '\\')}` : path;
  }

  private static async getSrcMap(location: ILocation, sourceMapUrl?: string): Promise<IFileMap> {
    let { path } = location;
    path = this.getPlatformPath(path);

    if (cache[path]) {
      const fileMap = await cache[path].promise;
      return fileMap;
    }

    const deferred = new Deferred<IFileMap>();
    cache[path] = deferred;

    const content = await readFile$(path, { encoding: 'utf8' });
    const exec = REGEX.exec(content);
    const result: IFileMap = { content };

    if (exec) {
      result.sourceMapPath = resolve(path, '..', exec[1]);
      result.sourceMap = require(result.sourceMapPath);
      result.consumer = await new SourceMapConsumer(result.sourceMap);
    } else if (sourceMapUrl) {
      const parsedSourceMapUrl = parseDataURL(sourceMapUrl);
      if (parsedSourceMapUrl && parsedSourceMapUrl.body) {
        const decoded = new TextDecoder().decode(parsedSourceMapUrl.body);
        result.sourceMap = JSON.parse(decoded);
        result.consumer = await new SourceMapConsumer(result.sourceMap);
      }
    }

    deferred.resolve(result);

    return result;
  }
}
