import type { NumberConstraints } from "./constraints.js";
import type { URIO } from "@fncts/base/control/IO";
import type { Lazy } from "@fncts/base/data/function";
import type { Predicate } from "@fncts/base/data/Predicate";
import type { Refinement } from "@fncts/base/data/Refinement";
import type { Has } from "@fncts/base/prelude/Has";
import type { _A, _R } from "@fncts/base/types.js";

import { Conc } from "@fncts/base/collection/immutable/Conc";
import { SortedMap } from "@fncts/base/collection/immutable/SortedMap";
import { Random } from "@fncts/base/control/Random";
import { Stream } from "@fncts/base/control/Stream";
import { IllegalArgumentError, NoSuchElementError } from "@fncts/base/data/exceptions";
import { tuple } from "@fncts/base/data/function";
import { identity } from "@fncts/base/data/function";
import { Just, Maybe, Nothing } from "@fncts/base/data/Maybe";

import { clamp } from "../../util/math.js";
import { Sample } from "../Sample.js";
import { Sized } from "../Sized.js";
import { Gen } from "./definition.js";

/**
 * @tsplus static fncts.test.control.GenOps anyBigInt
 */
export const anyBigInt: Gen<Has<Random>, bigint> = fromIOSample(
  Random.nextBigIntBetween(BigInt(-1) << BigInt(255), (BigInt(1) << BigInt(255)) - BigInt(1)).map(
    Sample.shrinkBigInt(BigInt(0)),
  ),
);

/**
 * @tsplus static fncts.test.control.GenOps anyDouble
 */
export const anyDouble: Gen<Has<Random>, number> = Gen.fromIOSample(
  Random.nextDouble.map(Sample.shrinkFractional(0)),
);

/**
 * @tsplus static fncts.test.control.GenOps anyInt
 */
export const anyInt: Gen<Has<Random>, number> = Gen.fromIOSample(
  Random.nextInt.map(Sample.shrinkIntegral(0)),
);

/**
 * @tsplus static fncts.test.control.GenOps bounded
 */
export function bounded<R, A>(
  min: number,
  max: number,
  f: (n: number) => Gen<R, A>,
): Gen<R & Has<Random>, A> {
  return Gen.int({ min, max }).chain(f);
}

/**
 * @tsplus static fncts.test.control.GenOps constant
 */
export function constant<A>(a: A): Gen<unknown, A> {
  return new Gen(Stream.succeedNow(Just(Sample.noShrink(a))));
}

/**
 * @tsplus fluent fncts.test.control.Gen chain
 */
export function chain_<R, A, R1, B>(ma: Gen<R, A>, f: (a: A) => Gen<R1, B>): Gen<R & R1, B> {
  return new Gen(
    Sample.chainStream(ma.sample, (sample) => {
      const values  = f(sample.value).sample;
      const shrinks = new Gen(sample.shrink).chain((a) => f(a)).sample;
      return values.map((maybeSample) =>
        maybeSample.map((sample) => sample.chain((b) => new Sample(b, shrinks))),
      );
    }),
  );
}

/**
 * @tsplus static fncts.test.control.GenOps defer
 */
export function defer<R, A>(gen: Lazy<Gen<R, A>>): Gen<R, A> {
  return Gen.fromIO(IO.succeed(gen)).flatten;
}

/**
 * @tsplus static fncts.test.control.GenOps empty
 */
export const empty: Gen<unknown, never> = new Gen(Stream.empty);

/**
 * @tsplus fluent fncts.test.control.Gen filter
 */
export function filter_<R, A, B extends A>(fa: Gen<R, A>, p: Refinement<A, B>): Gen<R, B>;
export function filter_<R, A>(fa: Gen<R, A>, p: Predicate<A>): Gen<R, A>;
export function filter_<R, A>(fa: Gen<R, A>, p: Predicate<A>): Gen<R, A> {
  return fa.chain((a) => (p(a) ? Gen.constant(a) : Gen.empty));
}

/**
 * @tsplus fluent fncts.test.control.Gen filterNot
 */
export function filterNot_<R, A>(fa: Gen<R, A>, p: Predicate<A>): Gen<R, A> {
  return fa.filter((a) => !p(a));
}

/**
 * @tsplus getter fncts.test.control.Gen flatten
 */
export function flatten<R, R1, A>(mma: Gen<R, Gen<R1, A>>): Gen<R & R1, A> {
  return mma.chain(identity);
}

/**
 * @tsplus static fncts.test.control.GenOps fromIO
 */
export function fromIO<R, A>(effect: IO<R, never, A>): Gen<R, A> {
  return Gen.fromIOSample(effect.map(Sample.noShrink));
}

/**
 * @tsplus static fncts.test.control.GenOps fromIOSample
 */
export function fromIOSample<R, A>(effect: IO<R, never, Sample<R, A>>): Gen<R, A> {
  return new Gen(Stream.fromIO(effect.map(Maybe.just)));
}

/**
 * @tsplus static fncts.test.control.GenOps int
 */
export function int(constraints: NumberConstraints = {}): Gen<Has<Random>, number> {
  return Gen.fromIOSample(
    IO.defer(() => {
      const min = constraints.min ?? -0x80000000;
      const max = constraints.max ?? 0x7fffffff;
      if (min > max || min < Number.MIN_SAFE_INTEGER || max > Number.MAX_SAFE_INTEGER) {
        return IO.haltNow(new IllegalArgumentError("invalid bounds", "Gen.int"));
      } else {
        return Random.nextIntBetween(min, max).map(Sample.shrinkIntegral(min));
      }
    }),
  );
}

/**
 * @tsplus fluent fncts.test.control.Gen map
 */
export function map_<R, A, B>(self: Gen<R, A>, f: (a: A) => B): Gen<R, B> {
  return new Gen(self.sample.map((maybeSample) => maybeSample.map((sample) => sample.map(f))));
}

/**
 * @tsplus fluent fncts.test.control.Gen mapIO
 */
export function mapIO_<R, A, R1, B>(
  self: Gen<R, A>,
  f: (a: A) => IO<R1, never, B>,
): Gen<R & R1, B> {
  return new Gen(
    self.sample.mapIO((maybeSample) =>
      maybeSample.match(
        () => IO.succeedNow(Nothing()),
        (sample) => sample.foreach(f).map(Maybe.just),
      ),
    ),
  );
}

/**
 * @tsplus static fncts.test.control.GenOps exponential
 */
export const exponential: Gen<Has<Random>, number> = Gen.uniform.map((n) => -Math.log(1 - n));

/**
 * @tsplus static fncts.test.control.GenOps size
 */
export const size: Gen<Has<Sized>, number> = Gen.fromIO(Sized.size);

/**
 * @tsplus static fncts.test.control.GenOps medium
 */
export function medium<R, A>(
  f: (n: number) => Gen<R, A>,
  min = 0,
): Gen<R & Has<Random> & Has<Sized>, A> {
  return Gen.size
    .chain((max) => Gen.exponential.map((n) => clamp(Math.round((n * max) / 10.0), min, max)))
    .reshrink(Sample.shrinkIntegral(min))
    .chain(f);
}

/**
 * @tsplus static fncts.test.control.GenOps memo
 */
export function memo<R, A>(
  builder: (maxDepth: number) => Gen<R, A>,
): (maxDepth?: number) => Gen<R, A> {
  const previous: { [depth: number]: Gen<R, A> } = {};
  let remainingDepth = 10;
  return (maxDepth?: number): Gen<R, A> => {
    const n = maxDepth !== undefined ? maxDepth : remainingDepth;
    if (!Object.prototype.hasOwnProperty.call(previous, n)) {
      const prev     = remainingDepth;
      remainingDepth = n - 1;
      previous[n]    = builder(n);
      remainingDepth = prev;
    }
    return previous[n]!;
  };
}

/**
 * @tsplus static fncts.test.control.GenOps nat
 */
export function nat(max = 0x7fffffff): Gen<Has<Random>, number> {
  return Gen.int({ min: 0, max: clamp(max, 0, max) });
}

/**
 * @tsplus static fncts.test.control.GenOps oneOf
 */
export function oneOf<A extends ReadonlyArray<Gen<any, any>>>(
  ...gens: A
): Gen<_R<A[number]> & Has<Random>, _A<A[number]>> {
  if (gens.isEmpty()) return Gen.empty;
  else return Gen.int({ min: 0, max: gens.length - 1 }).chain((i) => gens[i]!);
}

/**
 * @tsplus fluent fncts.test.control.Gen reshrink
 */
export function reshrink_<R, A, R1, B>(gen: Gen<R, A>, f: (a: A) => Sample<R1, B>): Gen<R & R1, B> {
  return new Gen(
    (gen.sample as Stream<R & R1, never, Maybe<Sample<R, A>>>).map((maybeSample) =>
      maybeSample.map((sample) => f(sample.value)),
    ),
  );
}

/**
 * @tsplus static fncts.test.control.GenOps sized
 */
export function sized<R, A>(f: (size: number) => Gen<R, A>): Gen<R & Has<Sized>, A> {
  return Gen.size.chain(f);
}

/**
 * @tsplus static fncts.test.control.GenOps small
 */
export function small<R, A>(
  f: (size: number) => Gen<R, A>,
  min = 0,
): Gen<R & Has<Sized> & Has<Random>, A> {
  return Gen.size
    .chain((max) => Gen.exponential.map((n) => clamp(Math.round((n * max) / 25), min, max)))
    .reshrink(Sample.shrinkIntegral(min))
    .chain(f);
}

/**
 * @tsplus static fncts.test.control.GenOps unfoldGen
 */
export function unfoldGen<S, R, A>(
  s: S,
  f: (s: S) => Gen<R, readonly [S, A]>,
): Gen<R & Has<Random> & Has<Sized>, Conc<A>> {
  return Gen.small((n) => Gen.unfoldGenN(n, s, f));
}

/**
 * @tsplus static fncts.test.control.GenOps unfoldGenN
 */
export function unfoldGenN<S, R, A>(
  n: number,
  s: S,
  f: (s: S) => Gen<R, readonly [S, A]>,
): Gen<R, Conc<A>> {
  if (n <= 0) return Gen.constant(Conc());
  else return f(s).chain(([s, a]) => Gen.unfoldGenN(n - 1, s, f).map((as) => as.append(a)));
}

/**
 * @tsplus static fncts.test.control.GenOps uniform
 */
export const uniform: Gen<Has<Random>, number> = Gen.fromIOSample(
  Random.nextDouble.map(Sample.shrinkFractional(0.0)),
);

/**
 * @tsplus static fncts.test.control.GenOps unwrap
 */
export function unwrap<R, R1, A>(effect: URIO<R, Gen<R1, A>>): Gen<R & R1, A> {
  return Gen.fromIO(effect).flatten;
}

/**
 * @tsplus static fncts.test.control.GenOps weighted
 */
export function weighted<R, A>(
  ...gens: ReadonlyArray<readonly [Gen<R, A>, number]>
): Gen<R & Has<Random>, A> {
  const sum   = gens.map(([, weight]) => weight).foldLeft(0, (b, a) => b + a);
  const [map] = gens.foldLeft(
    tuple(SortedMap.make<number, Gen<R, A>>(Number.Ord), 0),
    ([map, acc], [gen, d]) => {
      if ((acc + d) / sum > acc / sum) return tuple(map.insert((acc + d) / sum, gen), acc + d);
      else return tuple(map, acc);
    },
  );
  return Gen.uniform.chain((n) =>
    map.getGte(n).getOrElse(() => {
      throw new NoSuchElementError("Gen.weighted");
    }),
  );
}

/**
 * @tsplus fluent fncts.test.control.Gen zipWith
 */
export function zipWith_<R, A, R1, B, C>(
  self: Gen<R, A>,
  that: Gen<R1, B>,
  f: (a: A, b: B) => C,
): Gen<R & R1, C> {
  return self.chain((a) => that.map((b) => f(a, b)));
}
