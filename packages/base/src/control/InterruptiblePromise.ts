/**
 * @tsplus type fncts.InterruptiblePromise
 * @tsplus companion fncts.InterruptiblePromiseOps
 */
export interface InterruptiblePromise<A> extends Promise<A> {
  interrupt: () => void;
}

/**
 * @tsplus static fncts.InterruptiblePromiseOps __call
 */
export function make<A>(
  executor: (resolve: (value: A | PromiseLike<A>) => void, reject: (reason?: unknown) => void) => (() => void) | void,
): InterruptiblePromise<A> {
  const promise: InterruptiblePromise<A> = new Promise((resolve, reject) => {
    const canceller   = executor(resolve, reject);
    promise.interrupt = () => {
      canceller?.();
      reject(new InterruptedException());
    };
  }) as InterruptiblePromise<A>;
  return promise;
}
