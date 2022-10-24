import type { Atomic } from "./Atomic.js";
import type { PRef } from "./definition.js";

import { tuple } from "@fncts/base/data/function";
import { IO } from "@fncts/io/IO";

import { RefInternal } from "./definition.js";

export const DerivedAllTypeId = Symbol.for("fncts.io.Ref.DerivedAll");
export type DerivedAllTypeId = typeof DerivedAllTypeId;

export class DerivedAll<EA, EB, A, B> extends RefInternal<never, never, EA, EB, A, B> {
  readonly [DerivedAllTypeId]: DerivedAllTypeId = DerivedAllTypeId;

  constructor(
    readonly use: <X>(
      f: <S>(value: Atomic<S>, getEither: (s: S) => Either<EB, B>, setEither: (a: A) => (s: S) => Either<EA, S>) => X,
    ) => X,
  ) {
    super();
    this.match    = this.match.bind(this);
    this.matchAll = this.matchAll.bind(this);
    this.set      = this.set.bind(this);
  }

  match<EC, ED, C, D>(
    ea: (_: EA) => EC,
    eb: (_: EB) => ED,
    ca: (_: C) => Either<EC, A>,
    bd: (_: B) => Either<ED, D>,
  ): PRef<never, never, EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither) =>
        new DerivedAll((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) => ca(c).flatMap((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
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
  ): PRef<never, never, EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither) =>
        new DerivedAll((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match((e) => Either.left(ec(e)), ca(c))
                .flatMap((a) => setEither(a)(s).match((e) => Either.left(ea(e)), Either.right)),
          ),
        ),
    );
  }

  get get(): FIO<EB, B> {
    return this.use((value, getEither) => value.get.flatMap((s) => getEither(s).match(IO.failNow, IO.succeedNow)));
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

  modify<EA, EB, A, C>(
    this: DerivedAll<EA, EB, A, A>,
    f: (a: A) => readonly [C, A],
    __tsplusTrace?: string | undefined,
  ): IO<never, EA | EB, C> {
    return this.use(
      (value, getEither, setEither) =>
        value.modify((s) =>
          getEither(s).match(
            (e) => tuple(Either.left(e), s),
            (a1) => {
              const [b, a2] = f(a1);
              return setEither(a2)(s).match(
                (e) => tuple(Either.left(e), s),
                (s) => tuple(Either.right<EA | EB, C>(b), s),
              );
            },
          ),
        ).absolve,
    );
  }
}
