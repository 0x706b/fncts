import { FiberRefDelete, FiberRefLocally, FiberRefModify, FiberRefWith } from "@fncts/io/IO/definition";

/**
 * @tsplus type fncts.io.FiberRef
 */
export interface PFiberRef<EA, EB, A, B> {
  readonly _EA: () => EA;
  readonly _EB: () => EB;
  readonly _A: (_: A) => void;
  readonly _B: () => B;
  /**
   * Folds over the error and value types of the `FiberRef`. This is a highly
   * polymorphic method that is capable of arbitrarily transforming the error
   * and value types of the `FiberRef`. For most use cases one of the more
   * specific combinators implemented in terms of `match` will be more ergonomic
   * but this method is extremely useful for implementing new combinators.
   */
  readonly match: <EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ) => PFiberRef<EC, ED, C, D>;

  /**
   * Folds over the error and value types of the `ZFiberRef`, allowing access
   * to the state in transforming the `set` value. This is a more powerful
   * version of `match` but requires unifying the error types.
   */
  readonly matchAll: <EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ) => PFiberRef<EC, ED, C, D>;
  /**
   * Reads the value associated with the current fiber. Returns initial value if
   * no value was `set` or inherited from parent.
   */
  readonly get: FIO<EB, B>;
  /**
   * Returns the initial value or error.
   */
  readonly initialValue: Either<EB, B>;
  /**
   * Sets the value associated with the current fiber.
   */
  readonly set: (value: A) => FIO<EA, void>;
  /**
   * Returns an `IO` that runs with `value` bound to the current fiber.
   *
   * Guarantees that fiber data is properly restored via `acquireRelease`.
   */
  readonly locally: (value: A) => <R, EC, C>(use: IO<R, EC, C>) => IO<R, EA | EC, C>;

  readonly getWith: <R, E, C>(f: (b: B) => IO<R, E, C>) => IO<R, EB | E, C>;
}

/**
 * @tsplus type fncts.io.FiberRefOps
 */
export interface FiberRefOps {}

export const FiberRef: FiberRefOps = {};

export declare namespace FiberRef {
  type Runtime<A> = RuntimeFiberRef<A>;
}

export type FiberRef<A> = PFiberRef<never, never, A, A>;

/**
 * @tsplus type fncts.io.FiberRef
 */
export class RuntimeFiberRef<A> implements PFiberRef<never, never, A, A> {
  readonly _EA!: () => never;
  readonly _EB!: () => never;
  readonly _A!: (_: A) => void;
  readonly _B!: () => A;

  readonly _tag = "Runtime";

  constructor(readonly initial: A, readonly fork: (a: A) => A, readonly join: (a0: A, a1: A) => A) {}

  get delete(): UIO<void> {
    return new FiberRefDelete(this);
  }
  match<EC, ED, C, D>(
    _ea: (_: never) => EC,
    _eb: (_: never) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: A) => Either<ED, D>,
  ): PFiberRef<EC, ED, C, D> {
    return new DerivedFiberRef((f) => f(this, bd, ca));
  }

  matchAll<EC, ED, C, D>(
    ea: (_: never) => EC,
    eb: (_: never) => ED,
    ec: (_: never) => EC,
    ca: (_: C) => (_: A) => Either<EC, A>,
    bd: (_: A) => Either<ED, D>,
  ): PFiberRef<EC, ED, C, D> {
    return new DerivedAllFiberRef((f) => f(this, bd, ca, this.initialValue.flatMap(bd)));
  }

  modify<B>(f: (a: A) => readonly [B, A]): UIO<B> {
    return new FiberRefModify(this, f);
  }

  get get(): UIO<A> {
    return this.modify((v) => [v, v]);
  }

  get initialValue(): Either<never, A> {
    return Either.right(this.initial);
  }

  locally(value: A) {
    return <R, EC, C>(use: IO<R, EC, C>): IO<R, EC, C> => {
      return new FiberRefLocally(value, this, use);
    };
  }

  set(value: A): UIO<void> {
    return this.modify(() => [undefined, value]);
  }

  getWith<R, E, C>(f: (b: A) => IO<R, E, C>): IO<R, E, C> {
    return new FiberRefWith(this, f);
  }
}

export class DerivedFiberRef<EA, EB, A, B> implements PFiberRef<EA, EB, A, B> {
  readonly _EA!: () => EA;
  readonly _EB!: () => EB;
  readonly _A!: (_: A) => void;
  readonly _B!: () => B;

  readonly _tag = "Derived";

  constructor(
    readonly use: <X>(
      f: <S>(value: RuntimeFiberRef<S>, getEither: (s: S) => Either<EB, B>, setEither: (a: A) => Either<EA, S>) => X,
    ) => X,
  ) {}

  match<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PFiberRef<EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither) =>
        new DerivedFiberRef<EC, ED, C, D>((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => ca(c).flatMap((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
          ),
        ),
    );
  }

  matchAll<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PFiberRef<EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither) =>
        new DerivedAllFiberRef<EC, ED, C, D>((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((eb) => Either.left(ec(eb)), ca(c))
                .flatMap((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
            this.initialValue.mapLeft(eb).flatMap(bd),
          ),
        ),
    );
  }

  get get(): FIO<EB, B> {
    return this.use((value, getEither) => value.get.flatMap((s) => getEither(s).match(IO.failNow, IO.succeedNow)));
  }

  get initialValue(): Either<EB, B> {
    return this.use((value, getEither) => value.initialValue.flatMap(getEither));
  }

  locally(a: A) {
    return <R, EC, C>(use: IO<R, EC, C>): IO<R, EA | EC, C> => {
      return this.use((value, _, setEither) =>
        value.get.flatMap((old) =>
          setEither(a).match(
            (e) => IO.failNow(e),
            (s) =>
              value.set(s).bracket(
                () => use,
                () => value.set(old),
              ),
          ),
        ),
      );
    };
  }

  set(a: A): FIO<EA, void> {
    return this.use((value, _, setEither) => setEither(a).match(IO.failNow, (s) => value.set(s)));
  }

  getWith<R, E, C>(f: (b: B) => IO<R, E, C>): IO<R, EB | E, C> {
    return this.get.flatMap(f);
  }
}

export class DerivedAllFiberRef<EA, EB, A, B> implements PFiberRef<EA, EB, A, B> {
  readonly _EA!: () => EA;
  readonly _EB!: () => EB;
  readonly _A!: (_: A) => void;
  readonly _B!: () => B;

  readonly _tag = "DerivedAll";

  constructor(
    readonly use: <X>(
      f: <S>(
        value: RuntimeFiberRef<S>,
        getEither: (s: S) => Either<EB, B>,
        setEither: (a: A) => (s: S) => Either<EA, S>,
        initialValue: Either<EB, B>,
      ) => X,
    ) => X,
  ) {
    this.match    = this.match.bind(this);
    this.matchAll = this.matchAll.bind(this);
    this.set      = this.set.bind(this);
  }

  match<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PFiberRef<EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither, initialValue) =>
        new DerivedAllFiberRef<EC, ED, C, D>((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) => ca(c).flatMap((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
            initialValue.mapLeft(eb).flatMap(bd),
          ),
        ),
    );
  }

  matchAll<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ec: (_: EB) => EC,
    ca: (_: C) => (_: B) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PFiberRef<EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither, initialValue) =>
        new DerivedAllFiberRef((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((e) => Either.left(ec(e)), ca(c))
                .flatMap((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
            initialValue.mapLeft(eb).flatMap(bd),
          ),
        ),
    );
  }

  get get(): FIO<EB, B> {
    return this.use((value, getEither) => value.get.flatMap((s) => getEither(s).match(IO.failNow, IO.succeedNow)));
  }

  get initialValue(): Either<EB, B> {
    return this.use((_value, _getEither, _setEither, initialValue) => initialValue);
  }

  set(a: A): FIO<EA, void> {
    return this.use(
      (value, _, setEither) =>
        value.modify((s) =>
          setEither(a)(s).match(
            (e) => [Either.left(e), s] as [Either<EA, void>, typeof s],
            (s) => [Either.right(undefined), s],
          ),
        ).absolve,
    );
  }

  locally(a: A) {
    return <R, EC, C>(use: IO<R, EC, C>): IO<R, EA | EC, C> => {
      return this.use((value, _getEither, setEither) =>
        value.get.flatMap((old) =>
          setEither(a)(old).match(
            (e) => IO.failNow(e),
            (s) =>
              value.set(s).bracket(
                () => use,
                () => value.set(old),
              ),
          ),
        ),
      );
    };
  }

  getWith<R, E, C>(f: (b: B) => IO<R, E, C>): IO<R, EB | E, C> {
    return this.get.flatMap(f);
  }
}

type Concrete<EA, EB, A, B> = RuntimeFiberRef<A> | DerivedFiberRef<EA, EB, A, B> | DerivedAllFiberRef<EA, EB, A, B>;

/**
 * @tsplus macro remove
 */
export function concrete<EA, EB, A, B>(
  _: PFiberRef<EA, EB, A, B>,
  // @ts-expect-error
): asserts _ is Concrete<EA, EB, A, B> {
  //
}
