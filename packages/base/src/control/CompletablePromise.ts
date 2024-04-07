/**
 * @tsplus static fncts.CompletablePromiseOps __call
 */
export function make<A>(): CompletablePromise<A, A> {
  return new CompletablePromiseInternal();
}

/**
 * @tsplus type fncts.CompletablePromise
 * @tsplus companion fncts.CompletablePromiseOps
 */
export abstract class CompletablePromise<A, B = A> implements Promise<B> {
  [Symbol.toStringTag] = "CompletablePromise";
  public abstract resolve(a: A): void;
  public abstract reject(reason: unknown): void;

  abstract then<C = B, D = never>(
    onfulfilled?: ((value: B) => C | PromiseLike<C>) | null | undefined,
    onrejected?: ((reason: any) => D | PromiseLike<D>) | null | undefined,
  ): CompletablePromise<A, C | D>;
  abstract catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
  ): CompletablePromise<A, B | TResult>;
  abstract finally(onfinally?: (() => void) | null | undefined): CompletablePromise<A, B>;
}

class CompletablePromiseInternal<A> extends CompletablePromise<A, A> {
  private promise: Promise<A>;

  private internalResolve: (value: A) => void       = null!;
  private internalReject: (reason: unknown) => void = null!;

  constructor() {
    super();
    this.promise = new Promise((resolve, reject) => {
      this.internalResolve = resolve;
      this.internalReject  = reject;
    });
    this.resolve = this.resolve.bind(this);
    this.reject  = this.reject.bind(this);
  }

  public resolve(a: A): void {
    this.internalResolve(a);
  }

  public reject(reason: unknown): void {
    this.internalReject(reason);
  }

  then<C = A, D = never>(
    onfulfilled?: ((value: A) => C | PromiseLike<C>) | null | undefined,
    onrejected?: ((reason: any) => D | PromiseLike<D>) | null | undefined,
  ): CompletablePromise<A, C | D> {
    return new CompletablePromiseFromPromise(this.promise.then(onfulfilled, onrejected), this.resolve, this.reject);
  }
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
  ): CompletablePromise<A, A | TResult> {
    return new CompletablePromiseFromPromise(this.promise.catch(onrejected), this.resolve, this.reject);
  }
  finally(onfinally?: (() => void) | null | undefined): CompletablePromise<A, A> {
    return new CompletablePromiseFromPromise(this.promise.finally(onfinally), this.resolve, this.reject);
  }
}

class CompletablePromiseFromPromise<A, B> extends CompletablePromise<A, B> {
  constructor(
    private readonly promise: Promise<B>,
    readonly resolve: (a: A) => void,
    readonly reject: (reason: unknown) => void,
  ) {
    super();
  }

  then<C = B, D = never>(
    onfulfilled?: ((value: B) => C | PromiseLike<C>) | null | undefined,
    onrejected?: ((reason: any) => D | PromiseLike<D>) | null | undefined,
  ): CompletablePromise<A, C | D> {
    return new CompletablePromiseFromPromise(this.promise.then(onfulfilled, onrejected), this.resolve, this.reject);
  }
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
  ): CompletablePromise<A, B | TResult> {
    return new CompletablePromiseFromPromise(this.promise.catch(onrejected), this.resolve, this.reject);
  }
  finally(onfinally?: (() => void) | null | undefined): CompletablePromise<A, B> {
    return new CompletablePromiseFromPromise(this.promise.finally(onfinally), this.resolve, this.reject);
  }
}
