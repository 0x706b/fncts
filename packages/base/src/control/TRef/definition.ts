import type { HashMap } from "../../collection/immutable/HashMap.js";
import type { TxnId } from "../../data/TxnId.js";
import type { AtomicReference } from "../../internal/AtomicReference.js";
import type { Todo } from "../STM/internal/Journal.js";
import type { Versioned } from "../STM/internal/Versioned.js";

import { Either } from "../../data/Either.js";

export const TRefTypeId = Symbol.for("fncts.control.TRef");
export type TRefTypeId = typeof TRefTypeId;

/**
 * A `TRef<EA, EB, A, B>` is a polymorphic, purely functional description of a
 * mutable reference that can be modified as part of a transactional effect. The
 * fundamental operations of a `TRef` are `set` and `get`. `set` takes a value
 * of type `A` and transactionally sets the reference to a new value, potentially
 * failing with an error of type `EA`. `get` gets the current value of the reference
 * and returns a value of type `B`, potentially failing with an error of type `EB`.
 *
 * When the error and value types of the `TRef` are unified, that is, it is a
 * `TRef<E, E, A, A>`, the `TRef` also supports atomic `modify` and `update`
 * operations. All operations are guaranteed to be executed transactionally.
 *
 * NOTE: While `TRef` provides the transactional equivalent of a mutable reference,
 * the value inside the `TRef` should be immutable.
 *
 * @tsplus type fncts.control.TRef
 */
export interface TRef<EA, EB, A, B> {
  readonly _typeId: TRefTypeId;
  readonly _EA: () => EA;
  readonly _EB: () => EB;
  readonly _A: (_: A) => void;
  readonly _B: () => B;
}

/**
 * @tsplus type fncts.control.TRefOps
 */
export interface TRefOps {}

export const TRef: TRefOps = {};

export abstract class TRefInternal<EA, EB, A, B> implements TRef<EA, EB, A, B> {
  readonly _typeId: TRefTypeId = TRefTypeId;
  readonly _EA!: () => EA;
  readonly _EB!: () => EB;
  readonly _A!: (_: A) => void;
  readonly _B!: () => B;

  abstract match<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ca: (c: C) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): TRef<EC, ED, C, D>;

  abstract matchAll<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ec: (ea: EB) => EC,
    ca: (c: C) => (b: B) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): TRef<EC, ED, C, D>;
}

/**
 * @tsplus type fncts.control.TRef
 */
export interface UTRef<A> extends TRef<never, never, A, A> {}

/**
 * @tsplus type fncts.control.TRef
 */
export interface ETRef<E, A> extends TRef<E, E, A, A> {}

export class Atomic<A> extends TRefInternal<never, never, A, A> {
  readonly _typeId: TRefTypeId     = TRefTypeId;
  readonly _tag                    = "Atomic";
  readonly atomic: Atomic<unknown> = this as Atomic<unknown>;

  constructor(
    public versioned: Versioned<A>,
    readonly todo: AtomicReference<HashMap<TxnId, Todo>>,
  ) {
    super();
  }

  match<EC, ED, C, D>(
    _ea: (ea: never) => EC,
    _eb: (ea: never) => ED,
    ca: (c: C) => Either<EC, A>,
    bd: (b: A) => Either<ED, D>,
  ): TRef<EC, ED, C, D> {
    return new Derived((f) => f(bd, ca, this, this.atomic));
  }

  matchAll<EC, ED, C, D>(
    _ea: (ea: never) => EC,
    _eb: (ea: never) => ED,
    _ec: (ea: never) => EC,
    ca: (c: C) => (b: A) => Either<EC, A>,
    bd: (b: A) => Either<ED, D>,
  ): TRef<EC, ED, C, D> {
    return new DerivedAll((f) => f(bd, ca, this, this.atomic));
  }
}

export class Derived<EA, EB, A, B> extends TRefInternal<EA, EB, A, B> {
  readonly _typeId: TRefTypeId = TRefTypeId;
  readonly _tag                = "Derived";

  constructor(
    readonly use: <X>(
      f: <S>(
        getEither: (s: S) => Either<EB, B>,
        setEither: (a: A) => Either<EA, S>,
        value: Atomic<S>,
        atomic: Atomic<unknown>,
      ) => X,
    ) => X,
  ) {
    super();
  }

  match<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ca: (c: C) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): TRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new Derived((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => ca(c).chain((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
            value,
            atomic,
          ),
        ),
    );
  }

  matchAll<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ec: (ea: EB) => EC,
    ca: (c: C) => (b: B) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): TRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new DerivedAll((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((e) => Either.left(ec(e)), ca(c))
                .chain((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
            value,
            atomic,
          ),
        ),
    );
  }
}

export class DerivedAll<EA, EB, A, B> extends TRefInternal<EA, EB, A, B> {
  readonly _typeId: TRefTypeId = TRefTypeId;
  readonly _tag                = "DerivedAll";

  constructor(
    readonly use: <X>(
      f: <S>(
        getEither: (s: S) => Either<EB, B>,
        setEither: (a: A) => (s: S) => Either<EA, S>,
        value: Atomic<S>,
        atomic: Atomic<unknown>,
      ) => X,
    ) => X,
  ) {
    super();
  }

  match<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ca: (c: C) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): TRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new DerivedAll((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              ca(c).chain((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
            value,
            atomic,
          ),
        ),
    );
  }

  matchAll<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ec: (ea: EB) => EC,
    ca: (c: C) => (b: B) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): TRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new DerivedAll((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((e) => Either.left(ec(e)), ca(c))
                .chain((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
            value,
            atomic,
          ),
        ),
    );
  }
}

/**
 * @tsplus macro remove
 */
export function concrete<EA, EB, A, B>(
  _: TRef<EA, EB, A, B>,
): asserts _ is (Atomic<A> & Atomic<B>) | Derived<EA, EB, A, B> | DerivedAll<EA, EB, A, B> {
  //
}
