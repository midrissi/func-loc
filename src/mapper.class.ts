import { resolve } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

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
  public static async map(location: ILocation): Promise<ILocation> {
    const { consumer, sourceMapPath } = await this.getSrcMap(location);

    if(!consumer) {
      return null;
    }

    const mappedLocation = consumer.originalPositionFor({
      line: location.line,
      column: location.column,
    });

    if(
      !mappedLocation
      || !mappedLocation.column
      || !mappedLocation.line
    ) {
      return location;
    }

    const path = resolve(sourceMapPath, '..', mappedLocation.source);

    return {
      origin: location,
      line: mappedLocation.line,
      column: mappedLocation.column,
      path,
      source: `file://${path}`,
    }
  }

  private static async getSrcMap(location: ILocation): Promise<IFileMap> {
    const { path } = location;

    if(cache[path]) {
      const fileMap = await (cache[path].promise);
      return fileMap;
    }

    const deferred = new Deferred<IFileMap>();
    cache[path] = deferred;

    const content = await readFile$(path, { encoding: 'utf8' });
    const exec = REGEX.exec(content);
    const result: IFileMap = { content };

    if(exec) {
      result.sourceMapPath = resolve(path, '..', exec[1]);
      result.sourceMap = <RawSourceMap>require(result.sourceMapPath);
      result.consumer = await new SourceMapConsumer(result.sourceMap);
    }

    deferred.resolve(result);
    
    return result;
  }
}
