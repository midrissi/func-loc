# func-loc

[![Coveralls][coverage-badge]][coverage]
[![Build Status][travis-badge]][travis]
[![Dependencies][dependencies-badge]][dependencies]
[![npm version][npm-badge]][npm]
[![PRs Welcome][prs-badge]][prs]
[![MIT License][license-badge]][license]

A simple tool that help you to retrieve the function location from its reference.

## How to install

```
$ npm i func-loc
```

## How to use

```js
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

## APIs:

1. `locate(fn: Function)`: Will retrieve the location of a given function, and will cache it so that the second call will be faster.

The result of the call will be an object that contains these attributes:

- `source`: The source file
- `line`: The line where the function was defined
- `column`: The exact column where the function was declared

Internally, this function will open an [inspector](https://nodejs.org/api/inspector.html) session. So it is always a good idea to call the `disconnect` method when you are done.

2. `disconnect()`: will [`disconnect`](https://nodejs.org/api/inspector.html#inspector_session_disconnect) the [instpector](https://nodejs.org/api/inspector.html) [session](https://nodejs.org/api/inspector.html#inspector_class_inspector_session), cleans the cache and delete temporary created objects from the global object. 

## License

MIT © Mohamed IDRISSI

[coverage-badge]: https://coveralls.io/repos/github/midrissi/func-loc/badge.svg?branch=master
[coverage]: https://coveralls.io/github/midrissi/func-loc?branch=master
[travis-badge]: https://travis-ci.org/midrissi/func-loc.svg?branch=master
[travis]: https://travis-ci.org/midrissi/func-loc
[dependencies-badge]: https://david-dm.org/midrissi/func-loc/status.svg
[dependencies]: https://david-dm.org/midrissi/func-loc
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[npm-badge]: https://badge.fury.io/js/func-loc.svg
[npm]: https://www.npmjs.com/package/func-loc
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license]: https://github.com/midrissi/func-loc/blob/master/LICENSE
