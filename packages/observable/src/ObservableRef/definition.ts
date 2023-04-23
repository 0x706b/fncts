import type { Observable } from "@fncts/observable/Observable";

type Readable_<A> = Readable<A>;
type Writable_<A> = Writable<A>;

export declare namespace ObservableRef {
  type Readable<A> = Readable_<A>;
  type Writable<A> = Writable_<A>;
}

export class ObservableRefDescriptor<A> {
  constructor(readonly initial: A) {}
}

export interface CommonObservableRef {
  readonly unsafeClear: () => void;
  readonly clear: UIO<void>;
}

/**
 * @tsplus type fncts.observable.ObservableRef.Readable
 */
export interface Readable<out A> extends CommonObservableRef {
  readonly _Out: (_: never) => A;
  readonly get: UIO<A>;
  readonly unsafeGet: () => A;
  readonly observable: Observable<never, never, A>;
}

/**
 * @tsplus type fncts.observable.ObservableRef.Writable
 */
export interface Writable<in A> extends CommonObservableRef {
  readonly _In: (_: A) => void;
  set(a: A): UIO<void>;
  unsafeSet: (a: A) => void;
}

/**
 * @tsplus type fncts.observable.ObservableRef
 * @tsplus companion fncts.observable.ObservableRefOps
 */
export abstract class ObservableRef<in A, out B> implements Readable<B>, Writable<A> {
  declare _In: (_: A) => void;
  declare _Out: (_: never) => B;

  constructor(readonly descriptor: ObservableRefDescriptor<any>) {}

  abstract unsafeGet(): B;
  readonly get: UIO<B> = IO(this.unsafeGet());
  abstract unsafeSet(a: A): void;
  set(a: A): UIO<void> {
    return IO(this.unsafeSet(a));
  }
  abstract unsafeClear(): void;
  readonly clear = IO(this.unsafeClear());
  abstract readonly observable: Observable<never, never, B>;
}
