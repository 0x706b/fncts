export const InterruptiblePromiseTypeId = Symbol.for("fncts.base.InterruptiblePromise");
export type InterruptiblePromiseTypeId = typeof InterruptiblePromiseTypeId;

export function isInterruptiblePromise(u: unknown): u is InterruptiblePromise<unknown> {
  return isObject(u) && InterruptiblePromiseTypeId in u;
}

/**
 * @tsplus type fncts.InterruptiblePromise
 * @tsplus companion fncts.InterruptiblePromiseOps
 */
export abstract class InterruptiblePromise<A> implements Promise<A> {
  readonly [InterruptiblePromiseTypeId]: InterruptiblePromiseTypeId = InterruptiblePromiseTypeId;

  [Symbol.toStringTag] = "InterruptiblePromise";

  abstract then<TResult1 = A, TResult2 = never>(
    onfulfilled?: ((value: A) => TResult1 | PromiseLike<TResult1>) | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined,
  ): InterruptiblePromise<TResult1 | TResult2>;

  abstract catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined,
  ): Promise<A | TResult>;

  abstract finally(onfinally?: (() => void) | undefined): Promise<A>;

  abstract interrupt(): void;

  abstract isInterrupted: boolean;
}

/**
 * @tsplus static fncts.InterruptiblePromiseOps __call
 */
export function make<A>(
  executor: (resolve: (value: A | PromiseLike<A>) => void, reject: (reason?: unknown) => void) => (() => void) | void,
): InterruptiblePromise<A> {
  return new InterruptiblePromiseInternal(executor);
}

interface InterruptiblePromiseState {
  isInterrupted: boolean;
  callbacks: Set<() => void>;
}

class InterruptiblePromiseInternal<A> extends InterruptiblePromise<A> {
  private state: InterruptiblePromiseState;
  private promise: Promise<A>;

  constructor(
    executor: (
      resolve: (value: A | PromiseLike<A>) => void,
      reject: (reason: unknown) => void,
    ) => (() => void) | void = () => {},
    state?: InterruptiblePromiseState,
    promise?: Promise<A>,
  ) {
    super();
    this.interrupt = this.interrupt.bind(this);
    this.state = state ?? {
      isInterrupted: false,
      callbacks: new Set(),
    };
    this.promise =
      promise ??
      new Promise((resolve, reject) => {
        const onInterrupt = executor(resolve, reject);
        if (onInterrupt) {
          this.state.callbacks.add(onInterrupt);
        }
      });
  }

  then<TResult1 = A, TResult2 = never>(
    onfulfilled?: ((value: A) => TResult1 | PromiseLike<TResult1>) | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined,
  ): InterruptiblePromise<TResult1 | TResult2> {
    return new InterruptiblePromiseInternal(
      undefined,
      this.state,
      this.promise.then(this.createCallback(onfulfilled), this.createCallback(onrejected)),
    );
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined,
  ): Promise<A | TResult> {
    return new InterruptiblePromiseInternal(undefined, this.state, this.promise.catch(this.createCallback(onrejected)));
  }

  finally(onfinally?: (() => void) | undefined, runOnInterrupt: boolean = false): Promise<A> {
    if (onfinally && runOnInterrupt) {
      this.state.callbacks.add(onfinally);
    }
    return new InterruptiblePromiseInternal(
      undefined,
      this.state,
      this.promise.finally(() => {
        if (onfinally) {
          if (runOnInterrupt) {
            this.state.callbacks.delete(onfinally);
          }
          onfinally();
        }
      }),
    );
  }

  interrupt(): void {
    this.state.isInterrupted = true;
    this.state.callbacks.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error(err);
      }
    });
    this.state.callbacks.clear();
  }

  get isInterrupted(): boolean {
    return this.state.isInterrupted;
  }

  private createCallback<A, B>(callback?: (arg: A) => A | B): ((arg: A) => A | B) | undefined {
    if (callback) {
      return (arg) => {
        if (!this.state.isInterrupted) {
          const result = callback(arg);
          if (isInterruptiblePromise(result)) {
            this.state.callbacks.add(result.interrupt);
          }
          return result;
        }
        return arg;
      };
    }
  }
}
