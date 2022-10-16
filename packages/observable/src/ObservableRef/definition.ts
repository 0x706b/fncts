import type { URIO } from "@fncts/io/IO";
import type { Observable } from "@fncts/observable/Observable";

type Readable_<R, A> = Readable<R, A>;
type Writable_<R, A> = Writable<R, A>;

export declare namespace ObservableRef {
  type Readable<R, A> = Readable_<R, A>;
  type Writable<R, A> = Writable_<R, A>;
}

export class ObservableRefDescriptor<A> {
  constructor(readonly id: symbol, readonly initial: A) {}
}

export interface CommonObservableRef<out R> {
  readonly _R: (_: never) => R;
  readonly has: URIO<R, boolean>;
  readonly delete: URIO<R, void>;
}

/**
 * @tsplus type fncts.observable.ObservableRef.Readable
 */
export interface Readable<out R, out A> extends CommonObservableRef<R> {
  readonly _R: (_: never) => R;
  readonly _Out: (_: never) => A;
  readonly get: URIO<R, A>;
  readonly observable: Observable<R, never, A>;
}

/**
 * @tsplus type fncts.observable.ObservableRef.Writable
 */
export interface Writable<out R, in A> extends CommonObservableRef<R> {
  readonly _R: (_: never) => R;
  readonly _In: (_: A) => void;
  set(a: A): URIO<R, void>;
}

/**
 * @tsplus type fncts.observable.ObservableRef
 * @tsplus companion fncts.observable.ObservableRefOps
 */
export abstract class ObservableRef<out R, in A, out B> implements Readable<R, B>, Writable<R, A> {
  declare _R: (_: never) => R;
  declare _In: (_: A) => void;
  declare _Out: (_: never) => B;

  constructor(readonly descriptor: ObservableRefDescriptor<any>) {}

  abstract readonly get: URIO<R, B>;
  abstract set(a: A): URIO<R, void>;
  abstract readonly delete: URIO<R, boolean>;
  abstract readonly has: URIO<R, boolean>;
  abstract readonly observable: Observable<R, never, B>;
}
