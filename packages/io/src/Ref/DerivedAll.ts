import type { Atomic } from "./Atomic/Atomic.js";
import type { PRef } from "./definition.js";

import { RefInternal } from "./definition.js";

export class DerivedAll<EA, EB, A, B> extends RefInternal<unknown, unknown, EA, EB, A, B> {
  readonly _tag = "DerivedAll";

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
  ): PRef<unknown, unknown, EC, ED, C, D> {
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
  ): PRef<unknown, unknown, EC, ED, C, D> {
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
}
