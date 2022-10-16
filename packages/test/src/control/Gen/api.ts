import type { NumberConstraints } from "./constraints.js";
import type { _A, _R } from "@fncts/base/types.js";

import { SortedMap } from "@fncts/base/collection/immutable/SortedMap";
import { IllegalArgumentError, NoSuchElementError } from "@fncts/base/data/exceptions";
import { tuple } from "@fncts/base/data/function";
import { identity } from "@fncts/base/data/function";

import { clamp } from "../../util/math.js";
import { Sample } from "../Sample.js";
import { Sized } from "../Sized.js";
import { Gen } from "./definition.js";

/**
 * @tsplus static fncts.test.GenOps anyBigInt
 */
export const anyBigInt: Gen<never, bigint> = fromIOSample(
  Random.nextBigIntBetween(BigInt(-1) << BigInt(255), (BigInt(1) << BigInt(255)) - BigInt(1)).map(
    Sample.shrinkBigInt(BigInt(0)),
  ),
);

/**
 * @tsplus static fncts.test.GenOps anyDouble
 */
export const anyDouble: Gen<never, number> = Gen.fromIOSample(Random.nextDouble.map(Sample.shrinkFractional(0)));

/**
 * @tsplus static fncts.test.GenOps anyInt
 */
export const anyInt: Gen<never, number> = Gen.fromIOSample(Random.nextInt.map(Sample.shrinkIntegral(0)));

/**
 * @tsplus static fncts.test.GenOps bounded
 */
export function bounded<R, A>(min: number, max: number, f: (n: number) => Gen<R, A>): Gen<R, A> {
  return Gen.int({ min, max }).flatMap(f);
}

/**
 * @tsplus static fncts.test.GenOps constant
 */
export function constant<A>(a: A): Gen<never, A> {
  return new Gen(Stream.succeedNow(Just(Sample.noShrink(a))));
}

/**
 * @tsplus pipeable fncts.test.Gen flatMap
 */
export function flatMap<A, R1, B>(f: (a: A) => Gen<R1, B>) {
  return <R>(ma: Gen<R, A>): Gen<R | R1, B> => {
    return new Gen(
      Sample.flatMapStream(ma.sample, (sample) => {
        const values  = f(sample.value).sample;
        const shrinks = new Gen(sample.shrink).flatMap((a) => f(a)).sample;
        return values.map((maybeSample) => maybeSample.map((sample) => sample.flatMap((b) => new Sample(b, shrinks))));
      }),
    );
  };
}

/**
 * @tsplus static fncts.test.GenOps defer
 */
export function defer<R, A>(gen: Lazy<Gen<R, A>>): Gen<R, A> {
  return Gen.fromIO(IO.succeed(gen)).flatten;
}

/**
 * @tsplus static fncts.test.GenOps empty
 */
export const empty: Gen<never, never> = new Gen(Stream.empty);

/**
 * @tsplus pipeable fncts.test.Gen filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): <R>(fa: Gen<R, A>) => Gen<R, B>;
export function filter<A>(p: Predicate<A>): <R>(fa: Gen<R, A>) => Gen<R, A>;
export function filter<A>(p: Predicate<A>) {
  return <R>(fa: Gen<R, A>): Gen<R, A> => {
    return fa.flatMap((a) => (p(a) ? Gen.constant(a) : Gen.empty));
  };
}

/**
 * @tsplus pipeable fncts.test.Gen filterNot
 */
export function filterNot<A>(p: Predicate<A>) {
  return <R>(fa: Gen<R, A>): Gen<R, A> => {
    return fa.filter((a) => !p(a));
  };
}

/**
 * @tsplus getter fncts.test.Gen flatten
 */
export function flatten<R, R1, A>(mma: Gen<R, Gen<R1, A>>): Gen<R | R1, A> {
  return mma.flatMap(identity);
}

/**
 * @tsplus static fncts.test.GenOps fromIO
 */
export function fromIO<R, A>(effect: IO<R, never, A>): Gen<R, A> {
  return Gen.fromIOSample(effect.map(Sample.noShrink));
}

/**
 * @tsplus static fncts.test.GenOps fromIOSample
 */
export function fromIOSample<R, A>(effect: IO<R, never, Sample<R, A>>): Gen<R, A> {
  return new Gen(Stream.fromIO(effect.map(Maybe.just)));
}

/**
 * @tsplus static fncts.test.GenOps int
 */
export function int(constraints: NumberConstraints = {}): Gen<never, number> {
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
 * @tsplus pipeable fncts.test.Gen map
 */
export function map<A, B>(f: (a: A) => B) {
  return <R>(self: Gen<R, A>): Gen<R, B> => {
    return new Gen(self.sample.map((maybeSample) => maybeSample.map((sample) => sample.map(f))));
  };
}

/**
 * @tsplus pipeable fncts.test.Gen mapIO
 */
export function mapIO<A, R1, B>(f: (a: A) => IO<R1, never, B>) {
  return <R>(self: Gen<R, A>): Gen<R | R1, B> => {
    return new Gen(
      self.sample.mapIO((maybeSample) =>
        maybeSample.match(
          () => IO.succeedNow(Nothing()),
          (sample) => sample.foreach(f).map(Maybe.just),
        ),
      ),
    );
  };
}

/**
 * @tsplus static fncts.test.GenOps exponential
 */
export const exponential: Gen<never, number> = Gen.uniform.map((n) => -Math.log(1 - n));

/**
 * @tsplus static fncts.test.GenOps size
 */
export const size: Gen<Sized, number> = Gen.fromIO(Sized.size);

/**
 * @tsplus static fncts.test.GenOps medium
 */
export function medium<R, A>(f: (n: number) => Gen<R, A>, min = 0): Gen<R | Sized, A> {
  return Gen.size
    .flatMap((max) => Gen.exponential.map((n) => clamp(Math.round((n * max) / 10.0), min, max)))
    .reshrink(Sample.shrinkIntegral(min))
    .flatMap(f);
}

/**
 * @tsplus static fncts.test.GenOps memo
 */
export function memo<R, A>(builder: (maxDepth: number) => Gen<R, A>): (maxDepth?: number) => Gen<R, A> {
  const previous: {
    [depth: number]: Gen<R, A>;
  } = {};
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
 * @tsplus static fncts.test.GenOps nat
 */
export function nat(max = 0x7fffffff): Gen<unknown, number> {
  return Gen.int({ min: 0, max: clamp(max, 0, max) });
}

/**
 * @tsplus static fncts.test.GenOps oneOf
 */
export function oneOf<A extends ReadonlyArray<Gen<any, any>>>(...gens: A): Gen<_R<A[number]>, _A<A[number]>> {
  if (gens.isEmpty()) return Gen.empty;
  else return Gen.int({ min: 0, max: gens.length - 1 }).flatMap((i) => gens[i]!);
}

/**
 * @tsplus pipeable fncts.test.Gen reshrink
 */
export function reshrink<A, R1, B>(f: (a: A) => Sample<R1, B>) {
  return <R>(gen: Gen<R, A>): Gen<R | R1, B> => {
    return new Gen(
      (gen.sample as Stream<R | R1, never, Maybe<Sample<R, A>>>).map((maybeSample) =>
        maybeSample.map((sample) => f(sample.value)),
      ),
    );
  };
}

/**
 * @tsplus static fncts.test.GenOps sized
 */
export function sized<R, A>(f: (size: number) => Gen<R, A>): Gen<R | Sized, A> {
  return Gen.size.flatMap(f);
}

/**
 * @tsplus static fncts.test.GenOps small
 */
export function small<R, A>(f: (size: number) => Gen<R, A>, min = 0): Gen<R | Sized, A> {
  return Gen.size
    .flatMap((max) => Gen.exponential.map((n) => clamp(Math.round((n * max) / 25), min, max)))
    .reshrink(Sample.shrinkIntegral(min))
    .flatMap(f);
}

/**
 * @tsplus static fncts.test.GenOps unfoldGen
 */
export function unfoldGen<S, R, A>(s: S, f: (s: S) => Gen<R, readonly [S, A]>): Gen<R | Sized, Conc<A>> {
  return Gen.small((n) => Gen.unfoldGenN(n, s, f));
}

/**
 * @tsplus static fncts.test.GenOps unfoldGenN
 */
export function unfoldGenN<S, R, A>(n: number, s: S, f: (s: S) => Gen<R, readonly [S, A]>): Gen<R, Conc<A>> {
  if (n <= 0) return Gen.constant(Conc());
  else return f(s).flatMap(([s, a]) => Gen.unfoldGenN(n - 1, s, f).map((as) => as.append(a)));
}

/**
 * @tsplus static fncts.test.GenOps uniform
 */
export const uniform: Gen<never, number> = Gen.fromIOSample(Random.nextDouble.map(Sample.shrinkFractional(0.0)));

/**
 * @tsplus static fncts.test.GenOps unwrap
 */
export function unwrap<R, R1, A>(effect: URIO<R, Gen<R1, A>>): Gen<R | R1, A> {
  return Gen.fromIO(effect).flatten;
}

/**
 * @tsplus static fncts.test.GenOps weighted
 */
export function weighted<R, A>(...gens: ReadonlyArray<readonly [Gen<R, A>, number]>): Gen<R, A> {
  const sum   = gens.map(([, weight]) => weight).foldLeft(0, (b, a) => b + a);
  const [map] = gens.foldLeft(tuple(SortedMap.make<number, Gen<R, A>>(Number.Ord), 0), ([map, acc], [gen, d]) => {
    if ((acc + d) / sum > acc / sum) return tuple(map.set((acc + d) / sum, gen), acc + d);
    else return tuple(map, acc);
  });
  return Gen.uniform.flatMap((n) =>
    map.getGte(n).getOrElse(() => {
      throw new NoSuchElementError("Gen.weighted");
    }),
  );
}

/**
 * @tsplus pipeable fncts.test.Gen zipWith
 */
export function zipWith<A, R1, B, C>(that: Gen<R1, B>, f: (a: A, b: B) => C) {
  return <R>(self: Gen<R, A>): Gen<R | R1, C> => {
    return self.flatMap((a) => that.map((b) => f(a, b)));
  };
}
