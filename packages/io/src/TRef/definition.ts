import type { AtomicReference } from "@fncts/base/internal/AtomicReference";
import type { Journal, Todo } from "@fncts/io/STM/internal/Journal";
import type { Versioned } from "@fncts/io/STM/internal/Versioned";
import type { TxnId } from "@fncts/io/TxnId";

import { STM } from "@fncts/io/STM";
import { Effect } from "@fncts/io/STM";
import { Entry } from "@fncts/io/STM/internal/Entry";
import { _A, _B, _EA, _EB } from "@fncts/io/TRef/symbols";
export const TRefTypeId = Symbol.for("fncts.io.TRef");
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
 * @tsplus type fncts.io.TRef
 */
export interface PTRef<out EA, out EB, in A, out B> {
  readonly _typeId: TRefTypeId;
  readonly [_EA]: () => EA;
  readonly [_EB]: () => EB;
  readonly [_A]: (_: A) => void;
  readonly [_B]: () => B;
}

/**
 * @tsplus type fncts.io.TRef
 */
export type TRef<A> = PTRef<never, never, A, A>;

/**
 * @tsplus type fncts.io.TRefOps
 */
export interface TRefOps {}

export const TRef: TRefOps = {};

export abstract class TRefInternal<EA, EB, A, B> implements PTRef<EA, EB, A, B> {
  readonly _typeId: TRefTypeId = TRefTypeId;
  declare [_EA]: () => EA;
  declare [_EB]: () => EB;
  declare [_A]: (_: A) => void;
  declare [_B]: () => B;
  abstract get: STM<never, EB, B>;
  abstract modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string): STM<never, EA | EB, C>;
  abstract set(a: A, __tsplusTrace?: string): STM<never, EA, void>;
  abstract unsafeGet(journal: Journal, __tsplusTrace?: string): A;
  abstract unsafeSet(journal: Journal, a: A, __tsplusTrace?: string): void;
  abstract match<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ca: (c: C) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): PTRef<EC, ED, C, D>;
  abstract matchAll<EC, ED, C, D>(
    ea: (ea: EA) => EC,
    eb: (ea: EB) => ED,
    ec: (ea: EB) => EC,
    ca: (c: C) => (b: B) => Either<EC, A>,
    bd: (b: B) => Either<ED, D>,
  ): PTRef<EC, ED, C, D>;
}

export class Atomic<A> extends TRefInternal<never, never, A, A> {
  readonly _typeId: TRefTypeId     = TRefTypeId;
  readonly atomic: Atomic<unknown> = this as Atomic<unknown>;
  constructor(public versioned: Versioned<A>, readonly todo: AtomicReference<HashMap<TxnId, Todo>>) {
    super();
  }
  match<EC, ED, C, D>(
    _ea: (ea: never) => EC,
    _eb: (ea: never) => ED,
    ca: (c: C) => Either<EC, A>,
    bd: (b: A) => Either<ED, D>,
  ): PTRef<EC, ED, C, D> {
    return new Derived((f) => f(bd, ca, this, this.atomic));
  }
  matchAll<EC, ED, C, D>(
    _ea: (ea: never) => EC,
    _eb: (ea: never) => ED,
    _ec: (ea: never) => EC,
    ca: (c: C) => (b: A) => Either<EC, A>,
    bd: (b: A) => Either<ED, D>,
  ): PTRef<EC, ED, C, D> {
    return new DerivedAll((f) => f(bd, ca, this, this.atomic));
  }

  get get(): STM<never, never, A> {
    return new Effect((journal) => {
      const entry = getOrMakeEntry(this, journal);
      return entry.use((_) => _.unsafeGet<A>());
    });
  }

  set(a: A, __tsplusTrace?: string | undefined): STM<never, never, void> {
    return new Effect((journal) => {
      const entry = getOrMakeEntry(this, journal);
      return entry.use((_) => _.unsafeSet(a));
    });
  }

  modify<C>(f: (b: A) => readonly [C, A], __tsplusTrace?: string | undefined): STM<never, never, C> {
    return new Effect((journal) => {
      const entry                = getOrMakeEntry(this, journal);
      const oldValue             = entry.use((_) => _.unsafeGet<A>());
      const [retValue, newValue] = f(oldValue);
      entry.use((_) => _.unsafeSet(newValue));
      return retValue;
    });
  }

  unsafeGet(journal: Journal, __tsplusTrace?: string | undefined): A {
    return getOrMakeEntry(this.atomic, journal).use((entry) => entry.unsafeGet<A>());
  }

  unsafeSet(journal: Journal, a: A, __tsplusTrace?: string | undefined): void {
    return getOrMakeEntry(this.atomic, journal).use((entry) => entry.unsafeSet(a));
  }
}

export class Derived<EA, EB, A, B> extends TRefInternal<EA, EB, A, B> {
  readonly _typeId: TRefTypeId = TRefTypeId;
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
  ): PTRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new Derived((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => ca(c).flatMap((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
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
  ): PTRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new DerivedAll((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((e) => Either.left(ec(e)), ca(c))
                .flatMap((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
            value,
            atomic,
          ),
        ),
    );
  }

  get get(): STM<never, EB, B> {
    return this.use((getEither, _setEither, value, _atomic) =>
      value.get.flatMap((s) => getEither(s).match(STM.failNow, STM.succeedNow)),
    );
  }

  set(a: A, __tsplusTrace?: string | undefined): STM<never, EA, void> {
    return this.use((_getEither, setEither, value, _atomic) => setEither(a).match(STM.failNow, (s) => value.set(s)));
  }

  modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string | undefined): STM<never, EA | EB, C> {
    return this.use((getEither, setEither, value, _atomic) =>
      value.modify((s) =>
        getEither(s).match(
          (e) => [Either.left<EA | EB, C>(e), s],
          (a1) => {
            const [b, a2] = f(a1);
            return setEither(a2).match(
              (e) => [Either.left(e), s],
              (s) => [Either.right(b), s],
            );
          },
        ),
      ),
    ).absolve;
  }

  unsafeGet(journal: Journal, __tsplusTrace?: string | undefined): A {
    return this.use((_getEither, _setEither, _value, atomic) => getOrMakeEntry(atomic, journal)).use((entry) =>
      entry.unsafeGet(),
    );
  }

  unsafeSet(journal: Journal, a: A, __tsplusTrace?: string | undefined): void {
    return this.use((_getEither, _setEither, _value, atomic) => getOrMakeEntry(atomic, journal)).use((entry) =>
      entry.unsafeSet(a),
    );
  }
}

export class DerivedAll<EA, EB, A, B> extends TRefInternal<EA, EB, A, B> {
  readonly _typeId: TRefTypeId = TRefTypeId;
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
  ): PTRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new DerivedAll((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) => ca(c).flatMap((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
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
  ): PTRef<EC, ED, C, D> {
    return this.use(
      (getEither, setEither, value, atomic) =>
        new DerivedAll((f) =>
          f(
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((e) => Either.left(ec(e)), ca(c))
                .flatMap((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
            value,
            atomic,
          ),
        ),
    );
  }

  get get(): STM<never, EB, B> {
    return this.use((getEither, _setEither, value, _atomic) =>
      value.get.flatMap((s) => getEither(s).match(STM.failNow, STM.succeedNow)),
    );
  }

  set(a: A, __tsplusTrace?: string | undefined): STM<never, EA, void> {
    return this.use((_getEither, setEither, value, _atomic) =>
      value.modify((s) =>
        setEither(a)(s).match(
          (e) => [Either.left(e), s] as [Either<EA, void>, typeof s],
          (s) => [Either.right(undefined), s],
        ),
      ),
    ).absolve;
  }

  modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string | undefined): STM<never, EA | EB, C> {
    return this.use((getEither, setEither, value, atomic) =>
      value.modify((s) =>
        getEither(s).match(
          (e) => [Either.left<EA | EB, C>(e), s],
          (a1) => {
            const [b, a2] = f(a1);
            return setEither(a2)(s).match(
              (e) => [Either.left(e), s],
              (s) => [Either.right(b), s],
            );
          },
        ),
      ),
    ).absolve;
  }

  unsafeGet(journal: Journal, __tsplusTrace?: string | undefined): A {
    return this.use((_getEither, _setEither, _value, atomic) => getOrMakeEntry(atomic, journal)).use((entry) =>
      entry.unsafeGet(),
    );
  }

  unsafeSet(journal: Journal, a: A, __tsplusTrace?: string | undefined): void {
    return this.use((_getEither, _setEither, _value, atomic) => getOrMakeEntry(atomic, journal)).use((entry) =>
      entry.unsafeSet(a),
    );
  }
}

/**
 * @tsplus macro remove
 */
export function concrete<EA, EB, A, B>(
  _: PTRef<EA, EB, A, B>,
): asserts _ is (Atomic<A> & Atomic<B>) | Derived<EA, EB, A, B> | DerivedAll<EA, EB, A, B> {
  //
}

function getOrMakeEntry<A>(self: Atomic<A>, journal: Journal, __tsplusTrace?: string): Entry {
  if (journal.has(self)) {
    return journal.get(self)!;
  }
  const entry = Entry.make(self, false);
  journal.set(self, entry);
  return entry;
}
