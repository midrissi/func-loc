const { describe, it, afterEach } = require('mocha');
const { expect } = require('chai');
const { promisify } = require('util');

const { locate, clean } = require('..');

const fn = () => {};
function fn2() {}

function inner() {
  const fn3 = () => {};
  return fn3;
}

const KEYS_COUNT = Object.keys(global).length;

describe('locate(fn)', () => {
  it('works for inner functions', async () => {
    const result = await locate(inner());
    expect(result).to.eql({
      source: `file://${__filename}`,
      line: 11,
      column: 15,
    });
  });

  it('works for normal functions', async () => {
    const result = await locate(fn2);
    expect(result).to.eql({
      source: `file://${__filename}`,
      line: 8,
      column: 13,
    });
  });

  it('works for arrow functions', async () => {
    const result = await locate(fn);
    expect(result).to.eql({
      source: `file://${__filename}`,
      line: 7,
      column: 12,
    });
  });

  it('handles concurrent requests without error', async () => {
    const [r1, r2, r3] = await Promise.all([locate(inner()), locate(fn2), locate(fn)]);

    expect(r1).to.eql({
      source: `file://${__filename}`,
      line: 11,
      column: 15,
    });

    expect(r2).to.eql({
      source: `file://${__filename}`,
      line: 8,
      column: 13,
    });

    expect(r3).to.eql({
      source: `file://${__filename}`,
      line: 7,
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
    expect(result.source).to.equal('file://internal/util.js');
  });

  afterEach(async () => {
    await clean();
  });
});

describe('clean()', () => {
  it('should clean global object', async () => {
    await locate(fn);
    expect(Object.keys(global).length).to.equal(KEYS_COUNT + 1);
    await clean();
    expect(Object.keys(global).length).to.equal(KEYS_COUNT);
  });

  it('should return true if no session was created', async () => {
    const result = await clean();
    expect(result).to.equal(true);
  });
});
