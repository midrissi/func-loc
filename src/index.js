const { promisify } = require('util');
const { v4 } = require('uuid');

let session;
let fnCache = [];
const scripts = {};
const PREFIX = '__functionLocation__';

/**
 * Fetch a function from the cache
 * @param {Function} fn Find and return a function location object from the cache
 */
function fromCache(fn) {
  return fnCache.find(item => item.ref === fn);
}

/**
 * Diferred class
 */
class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

/**
 * Release created resources
 */
exports.clean = async () => {
  if (!session) {
    return true;
  }

  const post$ = promisify(session.post).bind(session);

  await post$('Runtime.releaseObjectGroup', {
    objectGroup: PREFIX,
  });

  session.disconnect();
  delete global[PREFIX];
  session = undefined;
  fnCache = [];

  return true;
};

/**
 * Locate a function
 * @param {Function} fn The function to locate
 * @returns {Object} An object containing the source file, the line and column where the column was
 * defined
 */
exports.locate = async fn => {
  if (typeof fn !== 'function') {
    throw new Error('You are allowed only to reference functions.');
  }

  // Look from the function inside the cache array and return it if it does exist.
  let result = fromCache(fn);

  if (result) {
    result = await result.location.promise;
    return result;
  }

  let post$;
  const deffered = new Deferred();

  // Push a deffered location into the cache
  fnCache.push({ ref: fn, location: deffered });

  // Create a function location object to put referencies into it
  // So that we can easilly access to them
  if (typeof global[PREFIX] === 'undefined') {
    global[PREFIX] = {};
  }

  // Create a reference of the function inside the global object
  const uuid = v4();
  global[PREFIX][uuid] = fn;

  // Create an inspector session an enable the debugger inside it
  if (!session) {
    // eslint-disable-next-line global-require,import/no-unresolved
    const { Session } = require('inspector');
    session = new Session();
    post$ = promisify(session.post).bind(session);
    session.connect();

    session.on('Debugger.scriptParsed', res => {
      scripts[res.params.scriptId] = res.params;
    });

    await post$('Debugger.enable');
  } else {
    post$ = promisify(session.post).bind(session);
  }

  // Evaluate the expression
  const evaluated = await post$('Runtime.evaluate', {
    expression: `global['${PREFIX}']['${uuid}']`,
    objectGroup: PREFIX,
  });

  // Get the function properties
  const properties = await post$('Runtime.getProperties', {
    objectId: evaluated.result.objectId,
  });

  const location = properties.internalProperties.find(prop => prop.name === '[[FunctionLocation]]');
  const script = scripts[location.value.value.scriptId];
  let source = script.url;

  // Normalize the source uri to ensure consistent result
  if (!source.startsWith('file://')) {
    source = `file://${source}`;
  }

  // Construct the result object
  result = {
    source,
    line: location.value.value.lineNumber + 1,
    column: location.value.value.columnNumber + 1,
  };

  // Resolve the defered variable
  deffered.resolve(result);

  // return the result
  return result;
};
