import type { NumberConstraints } from "./constraints";
import type { Lazy } from "@fncts/base/data/function";
import type { Predicate } from "@fncts/base/data/Predicate";
import type { Refinement } from "@fncts/base/data/Refinement";
import type { Has } from "@fncts/base/prelude/Has";

import { IO } from "@fncts/base/control/IO";
import { Random } from "@fncts/base/control/Random";
import { Stream } from "@fncts/base/control/Stream";
import { IllegalArgumentError } from "@fncts/base/data/exceptions";
import { identity } from "@fncts/base/data/function";
import { Just, Maybe } from "@fncts/base/data/Maybe";

import { clamp } from "../../util/math";
import { Sample } from "../Sample";
import { Gen } from "./definition";

export const anyBigInt: Gen<Has<Random>, bigint> = fromIOSample(
  Random.nextBigIntBetween(BigInt(-1) << BigInt(255), (BigInt(1) << BigInt(255)) - BigInt(1)).map(
    Sample.shrinkBigInt(BigInt(0)),
  ),
);

export const anyDouble: Gen<Has<Random>, number> = Gen.fromIOSample(
  Random.nextDouble.map(Sample.shrinkFractional(0)),
);

export const anyInt: Gen<Has<Random>, number> = Gen.fromIOSample(
  Random.nextInt.map(Sample.shrinkIntegral(0)),
);

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

export function filter_<R, A, B extends A>(fa: Gen<R, A>, p: Refinement<A, B>): Gen<R, B>;
export function filter_<R, A>(fa: Gen<R, A>, p: Predicate<A>): Gen<R, A>;
export function filter_<R, A>(fa: Gen<R, A>, p: Predicate<A>): Gen<R, A> {
  return fa.chain((a) => (p(a) ? Gen.constant(a) : Gen.empty));
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

export function reshrink_<R, A, R1, B>(gen: Gen<R, A>, f: (a: A) => Sample<R1, B>): Gen<R & R1, B> {
  return new Gen(
    (gen.sample as Stream<R & R1, never, Maybe<Sample<R, A>>>).map((maybeSample) =>
      maybeSample.map((sample) => f(sample.value)),
    ),
  );
}

/**
 * @tsplus static fncts.test.control.GenOps uniform
 */
export const uniform: Gen<Has<Random>, number> = Gen.fromIOSample(
  Random.nextDouble.map(Sample.shrinkFractional(0.0)),
);
