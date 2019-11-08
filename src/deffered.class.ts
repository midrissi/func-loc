export class Deferred<T> {
  public readonly promise: Promise<any>;
  public reject: (err: Error) => void;
  public resolve: (result: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}
