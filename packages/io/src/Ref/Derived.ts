import type { Atomic } from "./Atomic.js";
import type { PRef } from "./definition.js";

import { tuple } from "@fncts/base/data/function";
import { IO } from "@fncts/io/IO";

import { RefInternal } from "./definition.js";
import { DerivedAll } from "./DerivedAll.js";

export const DerivedTypeId = Symbol.for("fncts.io.Ref.Derived");
export type DerivedTypeId = typeof DerivedTypeId;

export class Derived<EA, EB, A, B> extends RefInternal<never, never, EA, EB, A, B> {
  readonly [DerivedTypeId]: DerivedTypeId = DerivedTypeId;

  constructor(
    readonly use: <X>(
      f: <S>(value: Atomic<S>, getEither: (s: S) => Either<EB, B>, setEither: (a: A) => Either<EA, S>) => X,
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
        new Derived<EC, ED, C, D>((f) =>
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
  ): PRef<never, never, EC, ED, C, D> {
    return this.use(
      (value, getEither, setEither) =>
        new DerivedAll<EC, ED, C, D>((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => (s) =>
              getEither(s)
                .match(
                  (eb) => Either.left(ec(eb)),
                  (b) => ca(c)(b),
                )
                .flatMap((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
          ),
        ),
    );
  }

  get get(): FIO<EB, B> {
    return this.use((value, getEither) => value.get.flatMap((s) => getEither(s).match(IO.failNow, IO.succeedNow)));
  }

  set(a: A): FIO<EA, void> {
    return this.use((value, _, setEither) => setEither(a).match(IO.failNow, (s) => value.set(s)));
  }

  modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string | undefined): IO<never, EA | EB, C> {
    return this.use(
      (value, getEither, setEither) =>
        value.modify((s) =>
          getEither(s).match(
            (e) => tuple(Either.left(e), s),
            (a1) => {
              const [b, a2] = f(a1);
              return setEither(a2).match(
                (e) => tuple(Either.left(e), s),
                (s) => tuple(Either.right<EA | EB, C>(b), s),
              );
            },
          ),
        ).absolve,
    );
  }
}
