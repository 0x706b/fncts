/**
 * @tsplus type fncts.CompletablePromise
 * @tsplus companion fncts.CompletablePromiseOps
 */
export interface CompletablePromise<A> extends Promise<A> {
  resolve: (a: A) => void;
  reject: (reason: unknown) => void;
}

/**
 * @tsplus static fncts.CompletablePromiseOps __call
 */
export function make<A>(): CompletablePromise<A> {
  let outerResolve: (a: A) => void           = () => {};
  let outerReject: (reason: unknown) => void = () => {};
  const promise: CompletablePromise<A>       = new Promise((resolve, reject) => {
    outerResolve = resolve;
    outerReject  = reject;
  }) as any;
  promise.resolve = outerResolve;
  promise.reject  = outerReject;
  return promise;
}
