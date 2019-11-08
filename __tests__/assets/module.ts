export function fn() {
  // Do nothing
}

export function fn2() {
  // Do nothing
}

export function inner() {
  const fn3 = () => {};
  return fn3;
}
