import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import { promisify } from 'util';
import {resolve} from 'path';

import { locate, clean } from '..'


import { fn, fn2, inner }  from './assets/module';
import { fn as tsFn, fn2 as tsFn2, inner as tsInner } from './assets/module-ts';

import { SourceMapper } from '../dist/mapper.class';
import { fn as fnInvalid1 } from './assets/invalid';
import { fn as fnInvalid2 } from './assets/invalid2';
import { URL } from 'url';

const modPath = './assets/module';

const __dirname = new URL('.', import.meta.url).pathname;

const { normalizePath } = SourceMapper;

const KEYS_COUNT = Object.keys(globalThis).length;
const modFullPath = normalizePath(`${resolve(__dirname, modPath)}.js`);
const modFullSource = `file://${modFullPath}`;
const tsPath = normalizePath(`${resolve(__dirname, modPath)}.ts`);
const tsSource = `file://${tsPath}`;

describe('locate(fn)', () => {
  it('works for inner functions', async () => {
    const result = await locate(inner());
    expect(result).to.eql({
      path: modFullPath,
      source: modFullSource,
      line: 12,
      column: 22,
    });
  });

  it('works for normal functions', async () => {
    const result = await locate(fn2);
    expect(result).to.eql({
      path: modFullPath,
      source: modFullSource,
      line: 7,
      column: 13,
    });
  });

  it('works for arrow functions', async () => {
    const result = await locate(fn);
    expect(result).to.eql({
      path: modFullPath,
      source: modFullSource,
      line: 3,
      column: 12,
    });
  });

  it('handles concurrent requests without error', async () => {
    const [r1, r2, r3] = await Promise.all([locate(inner()), locate(fn2), locate(fn)]);

    expect(r1).to.eql({
      path: modFullPath,
      source: modFullSource,
      line: 12,
      column: 22,
    });

    expect(r2).to.eql({
      path: modFullPath,
      source: modFullSource,
      line: 7,
      column: 13,
    });

    expect(r3).to.eql({
      path: modFullPath,
      source: modFullSource,
      line: 3,
      column: 12,
    });
  });

  it('should cache results', async () => {
    const r1 = await locate(fn);
    const r2 = await locate(fn);

    expect(r1).to.equal(r2);
  });

  it('should throw an exception if a non function was given', async () => {
    let error;
    try {
      await locate(1);
    } catch (e) {
      error = e;
    }

    expect(error).to.not.be.an('undefined');
  });

  it('should return consistent file format', async () => {
    const result = await locate(promisify);
    expect(result.source).to.equal('file://node:internal/util');
  });

  afterEach(async () => {
    await clean();
  });
});

describe('clean()', () => {
  it('should clean global object', async () => {
    await locate(fn);
    expect(Object.keys(globalThis).length).to.equal(KEYS_COUNT + 1);
    await clean();
    expect(Object.keys(globalThis).length).to.equal(KEYS_COUNT);
  });

  it('should return true if no session was created', async () => {
    const result = await clean();
    expect(result).to.equal(true);
  });
});

describe('locate(fn) with source maps', () => {
  it('should return the mapped source location', async () => {
    const result = await locate(fn2, { sourceMap: true });
    expect(result).to.eql({
      path: tsPath,
      source: tsSource,
      line: 5,
      column: 19,
      origin: {
        path: modFullPath,
        source: modFullSource,
        line: 7,
        column: 13,
      },
    });
  });

  it('should retrieve from the cache', async () => {
    let result = await locate(fn2, { sourceMap: true });

    expect(result.path).to.eql(tsPath);
    result = await locate(fn, { sourceMap: true });
    expect(result.path).to.eql(tsPath);
  });

  it('should retrieve from an nonexistent sourcemap', async () => {
    const result = await locate(fnInvalid1, { sourceMap: true });
    const p = normalizePath(resolve(__dirname, './assets/invalid.js'));

    expect(result.path).to.eql(p);
  });

  it('should retrieve from an invalid generated sourcemap', async () => {
    const result = await locate(fnInvalid2, { sourceMap: true });
    const p = normalizePath(resolve(__dirname, './assets/invalid2.js'));

    expect(result.path).to.eql(p);
  });

  it('should return correct locations using source map URLs', async () => {
    const [r1, r2, r3] = await Promise.all([
      locate(tsInner(), { sourceMap: true }),
      locate(tsFn2, { sourceMap: true }),
      locate(tsFn, { sourceMap: true }),
    ]);

    expect(r1).to.eql({
      path: tsPath,
      source: tsSource,
      line: 10,
      column: 14,
      origin: {
        path: tsPath,
        source: tsSource,
        line: 13,
        column: 17,
      },
    });

    expect(r2).to.eql({
      path: tsPath,
      source: tsSource,
      line: 5,
      column: 19,
      origin: {
        path: tsPath,
        source: tsSource,
        line: 8,
        column: 13,
      },
    });

    expect(r3).to.eql({
      path: tsPath,
      source: tsSource,
      line: 1,
      column: 18,
      origin: {
        path: tsPath,
        source: tsSource,
        line: 4,
        column: 12,
      },
    });
  });

  afterEach(async () => {
    await clean();
  });
});
