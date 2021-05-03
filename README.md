# func-loc

[![Coveralls][coverage-badge]][coverage]
[![Build Status][travis-badge]][travis]
[![Codacy Badge][codacy-badge]][codacy]
![David](https://img.shields.io/david/midrissi/func-loc)
![David](https://img.shields.io/david/dev/midrissi/func-loc)
![node](https://img.shields.io/node/v/func-loc)
![npm](https://img.shields.io/npm/dm/func-loc)
![npm](https://img.shields.io/npm/v/func-loc)
![GitHub issues](https://img.shields.io/github/issues/midrissi/func-loc)
![GitHub top language](https://img.shields.io/github/languages/top/midrissi/func-loc)
![GitHub contributors](https://img.shields.io/github/contributors/midrissi/func-loc)
[![npm version][npm-badge]][npm]
[![vulnerabilities][vulnerabilities-badge]][vulnerabilities]
[![PRs Welcome][prs-badge]][prs]
[![MIT License][license-badge]][license]

A simple tool that help you to retrieve the function location from its reference.

## How to install

```bash
$ npm i func-loc
```

## How to use

```javascript
const { locate } = require('func-loc');

const fn = () => {
  console.log('Hello there');
};

(async () => {
  const result = await locate(fn);
  console.log(result);
  // Will result: { source: 'file://__BASE_FOLDER__/func-loc/this-file.js', line: 3, column: 12 }
})();
```

## APIs

1.  `locate(fn: Function)`: Will retrieve the location of a given function, and will cache it so that the second call will be faster.

The result of the call will be an object that contains these attributes:

-   `source`: The source file.
-   `line`: The line where the function was defined.
-   `column`: The exact column where the function was declared.

Internally, this function will open an [inspector](https://nodejs.org/api/inspector.html) session. So it is always a good idea to call the `disconnect` method when you are done.

2.  `disconnect()` : will [`disconnect`](https://nodejs.org/api/inspector.html#inspector_session_disconnect) the [inspector](https://nodejs.org/api/inspector.html) [session](https://nodejs.org/api/inspector.html#inspector_class_inspector_session), cleans the cache and delete temporary created objects from the global object. 

## Using Source Maps

This library can also locate the original code using [source-map](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map):

Lets say that you have a typescript file containing:

```typescript
// File: `module.ts`
export function inner() {
  const fn3 = () => {};
  return fn3;
}
```

Transpiling this file using [typescript compiler](https://www.typescriptlang.org/) will generate a source map file like:

```json
{
  "origin": {
    "path": "/BASE_FOLDER/module.js",
    "column": 24,
    "line": 5,
    "source": "file:///BASE_FOLDER/module.js"
  },
  "line": 3,
  "column": 14,
  "path": "/BASE_FOLDER/module.ts",
  "source": "file:///BASE_FOLDER/module.ts"
}
```

And a javascript file containing:

```javascript
"use strict";
exports.__esModule = true;
// File: `module.ts`
function inner() {
    var fn3 = function () { };
    return fn3;
}
exports.inner = inner;
//# sourceMappingURL=module.js.map
```

If you execute the following code

```javascript
const { locate } = require('func-loc');
const { inner } = require('../__tests__/assets/module');

(async () => {
  const loc = await locate(inner(), { sourceMap: true });
  console.log(loc);
})();
```

It will output the line of the inner function f3 of the file `module.ts`:

```json
{
  "origin": {
    "path": "/BASE_FOLDER/module.js",
    "column": 24,
    "line": 5,
    "source": "file:///BASE_FOLDER/module.js"
  },
  "line": 3,
  "column": 14,
  "path": "/BASE_FOLDER/module.ts",
  "source": "file:///BASE_FOLDER/module.ts"
}
```

## License

MIT © Mohamed IDRISSI `2021`

[coverage-badge]: https://coveralls.io/repos/github/midrissi/func-loc/badge.svg?branch=master&service=github
[coverage]: https://coveralls.io/github/midrissi/func-loc?branch=master
[travis-badge]: https://travis-ci.org/midrissi/func-loc.svg?branch=master
[travis]: https://travis-ci.org/midrissi/func-loc
[codacy-badge]: https://api.codacy.com/project/badge/Grade/fd744ba304a244629886dfb19c85af40
[codacy]: https://www.codacy.com/app/midrissi/func-loc?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=midrissi/func-loc&amp;utm_campaign=Badge_Grade
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[prs]: http://makeapullrequest.com
[npm-badge]: https://badge.fury.io/js/func-loc.svg
[npm]: https://www.npmjs.com/package/func-loc
[vulnerabilities-badge]: https://snyk.io/test/github/midrissi/func-loc/badge.svg?targetFile=package.json
[vulnerabilities]: https://snyk.io/test/github/midrissi/func-loc?targetFile=package.json
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: https://github.com/midrissi/func-loc/blob/master/LICENSE
