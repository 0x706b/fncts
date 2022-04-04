import type { Atomic } from "./Atomic/Atomic.js";
import type { PRef } from "./definition.js";

import { RefInternal } from "./definition.js";
import { DerivedAll } from "./DerivedAll.js";

export class Derived<EA, EB, A, B> extends RefInternal<unknown, unknown, EA, EB, A, B> {
  readonly _tag = "Derived";

  constructor(
    readonly use: <X>(
      f: <S>(
        value: Atomic<S>,
        getEither: (s: S) => Either<EB, B>,
        setEither: (a: A) => Either<EA, S>,
      ) => X,
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
        new Derived<EC, ED, C, D>((f) =>
          f(
            value,
            (s) => getEither(s).match((e) => Either.left(eb(e)), bd),
            (c) => ca(c).chain((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
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
                .chain((a) => setEither(a).match((e) => Either.left(ea(e)), Either.right)),
          ),
        ),
    );
  }

  get get(): FIO<EB, B> {
    return this.use((value, getEither) =>
      value.get.chain((s) => getEither(s).match(IO.failNow, IO.succeedNow)),
    );
  }

  set(a: A): FIO<EA, void> {
    return this.use((value, _, setEither) => setEither(a).match(IO.failNow, (s) => value.set(s)));
  }
}
