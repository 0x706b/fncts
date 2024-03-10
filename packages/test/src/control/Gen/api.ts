import type {
  DateConstraints,
  EqConstraint,
  FloatConstraints,
  LengthConstraints,
  NumberConstraints,
  ObjectConstraints,
} from "./constraints.js";
import type { _A, _R } from "@fncts/base/types.js";
import type { ArrayInt64 } from "@fncts/base/util/rand";

import { SortedMap } from "@fncts/base/collection/immutable/SortedMap";
import { IllegalArgumentError, NoSuchElementError } from "@fncts/base/data/exceptions";
import { identity } from "@fncts/base/data/function";

import {
  add64,
  clamp,
  computeArrayInt64GenerateRange,
  indexToDouble,
  indexToFloat,
  isStrictlyPositive64,
  isStrictlySmaller64,
  MAX_VALUE_32,
  safeDoubleToIndex,
  safeFloatToIndex,
  substract64,
  Unit64,
} from "../../util/math.js";
import { Sample } from "../Sample.js";
import { Sized } from "../Sized.js";
import { Gen } from "./definition.js";

const gapSize = 0xdfff + 1 - 0xd800;

/**
 * @tsplus static fncts.test.GenOps anything
 */
export function anything<C extends ObjectConstraints>(
  constraints: C = {} as C,
): Gen<
  ObjectConstraints extends C
    ? Sized
    : unknown extends C["key"]
      ? Sized
      : _R<C["key"]> | C["values"] extends Array<infer A>
        ? _R<A>
        : Sized,
  unknown
> {
  const key      = constraints.key ?? Gen.alphaNumericString;
  const maxDepth = constraints.maxDepth ?? 2;
  const maxKeys  = constraints.maxKeys ?? 5;
  const values   = constraints.values ?? [
    Gen.boolean,
    Gen.alphaNumericString,
    Gen.double,
    Gen.int,
    Gen.oneOf(Gen.alphaNumericString, Gen.constant(null), Gen.constant(undefined)),
  ];

  function mapOf<R, K, R1, V>(key: Gen<R, K>, value: Gen<R1, V>) {
    return Gen.tuple(key, value)
      .uniqueConc({
        eq: Eq({
          equals:
            ([k1]) =>
            ([k]) =>
              Equatable.strictEquals(k, k1),
        }),
        maxLength: maxKeys,
      })
      .map((pairs) => new Map(pairs));
  }

  function setOf<R, V>(value: Gen<R, V>) {
    return value
      .uniqueConc({ eq: Eq({ equals: (v1) => (v) => Equatable.strictEquals(v, v1) }), maxLength: maxKeys })
      .map((values) => new Set(values));
  }

  const base       = Gen.oneOf(...values);
  const arrayBase  = Gen.oneOf(...values.map((gen) => gen.arrayWith({ maxLength: maxKeys })));
  const arrayGen   = Gen.memo((n) => Gen.oneOf(arrayBase, gen(n).arrayWith({ maxLength: maxKeys })));
  const objectBase = Gen.oneOf(...values.map((gen) => Gen.record(key, gen)));
  const objectGen  = Gen.memo((n) => Gen.oneOf(objectBase, Gen.record(key, gen(n))));
  const setBase    = Gen.oneOf(...values.map(setOf));
  const setGen     = Gen.memo((n) => Gen.oneOf(setBase, setOf(gen(n))));
  const mapBase    = Gen.oneOf(...values.map((value) => mapOf(key, value)));
  const mapGen     = Gen.memo((n) => Gen.oneOf(mapBase, mapOf(Gen.oneOf(key, gen(n)), gen(n))));

  const gen: (n: number) => Gen<any, any> = Gen.memo((n) => {
    if (n <= 0) return base;
    return Gen.oneOf(
      base,
      arrayGen(),
      objectGen(),
      ...(constraints.withDate ? [Gen.date()] : []),
      ...(constraints.withSet ? [setGen()] : []),
      ...(constraints.withMap ? [mapGen()] : []),
      ...(constraints.withTypedArray
        ? [
            Gen.oneOf(
              Gen.int8Array(),
              Gen.uint8Array(),
              Gen.int16Array(),
              Gen.uint16Array(),
              Gen.int32Array(),
              Gen.uint32Array(),
            ),
          ]
        : []),
    );
  });

  return gen(maxDepth);
}

/**
 * @tsplus static fncts.test.GenOps size
 */
export const size: Gen<Sized, number> = Gen.fromIO(Sized.size);

/**
 * @tsplus static fncts.test.GenOps uniform
 */
export const uniform: Gen<never, number> = Gen.fromIOSample(Random.nextDouble.map(Sample.shrinkFractional(0.0)));

/**
 * @tsplus static fncts.test.GenOps alphaNumericChar
 */
export const alphaNumericChar: Gen<never, string> = Gen.weighted(
  [Gen.char({ min: 48, max: 57 }), 10],
  [Gen.char({ min: 65, max: 90 }), 26],
  [Gen.char({ min: 97, max: 122 }), 26],
);

/**
 * @tsplus static fncts.test.GenOps alphaNumericStringWith
 */
export function alphaNumericStringWith(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return alphaNumericChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps alphaNumericString
 */
export const alphaNumericString: Gen<Sized, string> = alphaNumericChar.string();

/**
 * @tsplus static fncts.test.GenOps array
 * @tsplus getter fncts.test.Gen array
 */
export function array<R, A>(self: Gen<R, A>): Gen<R | Sized, ReadonlyArray<A>> {
  return self.arrayWith();
}

/**
 * @tsplus pipeable fncts.test.Gen arrayWith
 */
export function arrayWith(constraints: LengthConstraints = {}) {
  return <R, A>(g: Gen<R, A>): Gen<R | Sized, ReadonlyArray<A>> => {
    const minLength = constraints.minLength || 0;
    return constraints.maxLength
      ? Gen.intWith({ min: minLength, max: constraints.maxLength }).flatMap((n) => g.arrayN(n))
      : Gen.small((n) => g.arrayN(n), minLength);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen arrayN
 */
export function arrayN(n: number) {
  return <R, A>(self: Gen<R, A>): Gen<R, ReadonlyArray<A>> => {
    return self.concN(n).map((conc) => conc.toArray);
  };
}

/**
 * @tsplus static fncts.test.GenOps arrayInt64
 */
export function arrayInt64(min: ArrayInt64, max: ArrayInt64): Gen<never, ArrayInt64> {
  return new Gen(
    Stream.fromIO(computeArrayInt64GenerateRange(min, max, undefined, undefined))
      .flatMap(({ min, max }) => Stream.repeatIO(Random.nextArrayIntBetween(min, max)))
      .map((uncheckedValue) => {
        if (uncheckedValue.data.length === 1) {
          uncheckedValue.data.unshift(0);
        }
        return Just(Sample.shrinkArrayInt64(min)(uncheckedValue as ArrayInt64));
      }),
  );
}

/**
 * @tsplus static fncts.test.GenOps asciiChar
 */
export const asciiChar: Gen<never, string> = _char(0x00, 0x7f, indexToPrintableIndex);

/**
 * @tsplus static fncts.test.GenOps asciiStringWith
 */
export function asciiStringWith(constraints?: LengthConstraints): Gen<Sized, string> {
  return asciiChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps asciiString
 */
export const asciiString: Gen<Sized, string> = asciiStringWith();

/**
 * @tsplus static fncts.test.GenOps base64Char
 */
export const base64Char: Gen<never, string> = _char(0, 63, base64ToCharCode);

/**
 * @tsplus static fncts.test.GenOps base64String
 */
export const base64String: Gen<Sized, string> = Gen.base64StringWith();

/**
 * @tsplus static fncts.test.GenOps base64StringWith
 */
export function base64StringWith(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return base64Char.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps bigInt
 */
export const bigInt: Gen<never, bigint> = Gen.fromIOSample(
  Random.nextBigIntBetween(BigInt(-1) << BigInt(255), (BigInt(1) << BigInt(255)) - BigInt(1)).map(
    Sample.shrinkBigInt(BigInt(0)),
  ),
);

/**
 * @tsplus static fncts.test.GenOps boolean
 */
export const boolean: Gen<never, boolean> = Gen.defer(Gen.oneOf(Gen.constant(true), Gen.constant(false)));

/**
 * @tsplus static fncts.test.GenOps bounded
 */
export function bounded<R, A>(min: number, max: number, f: (n: number) => Gen<R, A>): Gen<R, A> {
  return Gen.intWith({ min, max }).flatMap(f);
}

/**
 * @tsplus static fncts.test.GenOps char
 */
export function char(constraints: Required<NumberConstraints>): Gen<never, string> {
  return _char(constraints.min, constraints.max, identity);
}

/**
 * @tsplus static fncts.test.GenOps char16
 */
export const char16: Gen<never, string> = _char(0x0000, 0xffff, indexToPrintableIndex);

/**
 * @tsplus pipeable fncts.test.Gen conc
 */
export function concWith(constraints: LengthConstraints = {}) {
  return <R, A>(self: Gen<R, A>): Gen<R | Sized, Conc<A>> => {
    const minLength = constraints.minLength ?? 0;
    return constraints.maxLength
      ? Gen.intWith({ min: minLength, max: constraints.maxLength }).flatMap((n) => self.concN(n))
      : Gen.small((n) => self.concN(n), minLength);
  };
}

/**
 * @tsplus getter fncts.test.Gen conc
 * @tsplus static fncts.test.GenOps conc
 */
export function conc<R, A>(self: Gen<R, A>): Gen<R | Sized, Conc<A>> {
  return self.conc();
}

/**
 * @tsplus pipeable fncts.test.Gen concN
 */
export function concN(n: number) {
  return <R, A>(g: Gen<R, A>): Gen<R, Conc<A>> => {
    return Conc.replicate(n, g).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
      gen.zipWith(a, (as, a) => as.append(a)),
    );
  };
}

/**
 * @tsplus static fncts.test.GenOps constant
 */
export function constant<A>(a: A): Gen<never, A> {
  return new Gen(Stream.succeedNow(Just(Sample.noShrink(a))));
}

/**
 * @tsplus static fncts.test.GenOps defer
 */
export function defer<R, A>(gen: Lazy<Gen<R, A>>): Gen<R, A> {
  return Gen.fromIO(IO.succeed(gen)).flatten;
}

/**
 * @tsplus static fncts.test.GenOps double
 */
export const double: Gen<never, number> = Gen.fromIOSample(Random.nextDouble.map(Sample.shrinkFractional(0)));

/**
 * @tsplus static fncts.test.GenOps doubleWith
 */
export function doubleWith(constraints: NumberConstraints & FloatConstraints = {}): Gen<never, number> {
  const {
    noDefaultInfinity = false,
    noNaN = false,
    min = noDefaultInfinity ? -Number.MAX_VALUE : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? Number.MAX_VALUE : Number.POSITIVE_INFINITY,
  } = constraints;
  return Gen.unwrap(
    IO.gen(function* (_) {
      const minIndex = yield* _(safeDoubleToIndex(min, "min"));
      const maxIndex = yield* _(safeDoubleToIndex(max, "max"));
      if (isStrictlySmaller64(maxIndex, minIndex)) {
        return yield* _(IO.haltNow(new IllegalArgumentError("min must be less than or equal to max", "Gen.double")));
      }
      if (noNaN) {
        return arrayInt64(minIndex, maxIndex).map(indexToDouble);
      }
      const positiveMaxIdx  = isStrictlyPositive64(maxIndex);
      const minIndexWithNaN = positiveMaxIdx ? minIndex : substract64(minIndex, Unit64);
      const maxIndexWithNaN = positiveMaxIdx ? add64(maxIndex, Unit64) : maxIndex;
      return arrayInt64(minIndexWithNaN, maxIndexWithNaN).map((index) => {
        if (isStrictlySmaller64(maxIndex, index) || isStrictlySmaller64(index, minIndex)) return Number.NaN;
        else return indexToDouble(index);
      });
    }),
  );
}

/**
 * @tsplus static fncts.test.GenOps empty
 */
export const empty: Gen<never, never> = new Gen(Stream.empty);

/**
 * @tsplus static fncts.test.GenOps exponential
 */
export const exponential: Gen<never, number> = Gen.uniform.map((n) => -Math.log(1 - n));

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
 * @tsplus static fncts.test.GenOps floatWith
 */
export function floatWith(constraints: NumberConstraints & FloatConstraints = {}): Gen<never, number> {
  const {
    noDefaultInfinity = false,
    min = noDefaultInfinity ? -MAX_VALUE_32 : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? MAX_VALUE_32 : Number.POSITIVE_INFINITY,
    noNaN = false,
  } = constraints;
  return Gen.unwrap(
    IO.gen(function* (_) {
      const minIndex = yield* _(safeFloatToIndex(min, "min"));
      const maxIndex = yield* _(safeFloatToIndex(max, "max"));
      if (minIndex > maxIndex) {
        return yield* _(
          IO.haltNow(new Error("Gen.float constraints.min must be less than or equal to constraints.max")),
        );
      }
      if (noNaN) {
        return Gen.intWith({ min: minIndex, max: maxIndex }).map(indexToFloat);
      }
      const minIndexWithNaN = maxIndex > 0 ? minIndex : minIndex - 1;
      const maxIndexWithNaN = maxIndex > 0 ? maxIndex + 1 : maxIndex;
      return Gen.intWith({ min: minIndexWithNaN, max: maxIndexWithNaN }).map((index) => {
        if (index > maxIndex || index < minIndex) return Number.NaN;
        else return indexToFloat(index);
      });
    }),
  );
}

/**
 * @tsplus static fncts.test.GenOps float
 */
export const float: Gen<never, number> = floatWith();

/**
 * @tsplus static fncts.test.GenOps fullUnicodeChar
 */
export const fullUnicodeChar: Gen<never, string> = _char(0x0000, 0x10ffff - gapSize, unicodeToCharCode);

/**
 * @tsplus static fncts.test.GenOps fullUnicodeString
 */
export function fullUnicodeString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return fullUnicodeChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps hexChar
 */
export const hexChar: Gen<never, string> = _char(0, 15, hexToCharCode);

/**
 * @tsplus static fncts.test.GenOps hexString
 */
export function hexString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return hexChar.string(constraints);
}

/**
 * @tsplus static fncts.test.GenOps int
 */
export const int: Gen<never, number> = Gen.fromIOSample(Random.nextInt.map(Sample.shrinkIntegral(0)));

/**
 * @tsplus static fncts.test.GenOps intWith
 */
export function intWith(constraints: NumberConstraints = {}): Gen<never, number> {
  return Gen.fromIOSample(
    IO.defer(() => {
      const min = constraints.min ?? -0x80000000;
      const max = constraints.max ?? 0x7fffffff;
      if (min > max || min < Number.MIN_SAFE_INTEGER || max > Number.MAX_SAFE_INTEGER) {
        return IO.haltNow(new IllegalArgumentError("invalid bounds", "Gen.intWith"));
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
  return Gen.intWith({ min: 0, max: clamp(max, 0, max) });
}

/**
 * @tsplus static fncts.test.GenOps oneOf
 */
export function oneOf<A extends ReadonlyArray<Gen<any, any>>>(...gens: A): Gen<_R<A[number]>, _A<A[number]>> {
  if (gens.isEmpty()) return Gen.empty;
  else return Gen.intWith({ min: 0, max: gens.length - 1 }).flatMap((i) => gens[i]!);
}

/**
 * @tsplus static fncts.test.GenOps partial
 */
export function partial<P extends Record<string, Gen<any, any>>>(
  properties: P,
): Gen<
  _R<P[keyof P]>,
  Partial<{
    readonly [K in keyof P]: _A<P[K]>;
  }>
> {
  const entries = Object.entries(properties);
  return entries.foldLeft(Gen.constant({}) as Gen<any, any>, (b, [k, gen]) =>
    Gen.unwrap(Random.nextBoolean.ifIO(IO.succeed(b.zipWith(gen, (r, a) => ({ ...r, [k]: a }))), IO.succeed(b))),
  );
}

/**
 * @tsplus static fncts.test.GenOps printableChar
 */
export const printableChar: Gen<never, string> = Gen.char({ min: 0x20, max: 0x7e });

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
 * @tsplus static fncts.test.GenOps string16
 */
export function string16(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return char16.string(constraints);
}

/**
 * @tsplus pipeable fncts.test.Gen string
 */
export function string(constraints: LengthConstraints = {}) {
  return <R>(char: Gen<R, string>): Gen<R | Sized, string> => {
    const min = constraints.minLength || 0;
    return constraints.maxLength
      ? Gen.bounded(min, constraints.maxLength, (n) => char.stringN(n))
      : Gen.small((n) => char.stringN(n), min);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen stringN
 */
export function stringN(n: number) {
  return <R>(char: Gen<R, string>): Gen<R, string> => {
    return char.arrayN(n).map((arr) => arr.join(""));
  };
}

/**
 * @tsplus static fncts.test.GenOps struct
 */
export function struct<P extends Record<string, Gen<any, any>>>(
  properties: P,
): Gen<
  _R<P[keyof P]>,
  {
    readonly [K in keyof P]: _A<P[K]>;
  }
> {
  const entries = Object.entries(properties);
  return entries.foldLeft(Gen.constant({}) as Gen<any, any>, (b, [k, gen]) =>
    b.zipWith(gen, (out, a) => ({ ...out, [k]: a })),
  );
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
 * @tsplus static fncts.test.GenOps unicodeChar
 */
export const unicodeChar: Gen<never, string> = _char(0x0000, 0xffff - gapSize, unicodeToCharCode);

/**
 * @tsplus static fncts.test.GenOps unicodeString
 */
export function unicodeString(constraints: LengthConstraints = {}): Gen<Sized, string> {
  return unicodeChar.string(constraints);
}

/**
 * @tsplus pipeable fncts.test.Gen uniqueArray
 */
export function uniqueArray<A>(constraints: LengthConstraints & EqConstraint<A> = {}) {
  return <R>(gen: Gen<R, A>): Gen<Sized | R, ReadonlyArray<A>> => {
    return gen.uniqueConc(constraints).map((conc) => conc.toArray);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen uniqueConc
 */
export function uniqueConc<A>(constraints: LengthConstraints & EqConstraint<A> = {}) {
  return <R>(self: Gen<R, A>): Gen<Sized | R, Conc<A>> => {
    const minLength = constraints.minLength ?? 0;
    const eq        = constraints.eq ?? Eq({ equals: (y) => (x) => Equatable.strictEquals(x, y) });
    return constraints.maxLength
      ? Gen.bounded(minLength, constraints.maxLength, (n) => self.uniqueConcN(n, eq))
      : Gen.small((n) => self.uniqueConcN(n, eq), minLength);
  };
}

/**
 * @tsplus pipeable fncts.test.Gen uniqueConcN
 */
export function uniqueConcN<A>(n: number, /** @tsplus auto */ E: Eq<A>) {
  return <R>(self: Gen<R, A>): Gen<R, Conc<A>> => {
    return Conc.replicate(n, self).foldLeft(Gen.constant(Conc.empty()) as Gen<R, Conc<A>>, (gen, a) =>
      gen.zipWith(a, (as, a) => (as.elem(a, E) ? as : as.append(a))),
    );
  };
}

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
  const [map] = gens.foldLeft(
    Function.tuple(SortedMap.make<number, Gen<R, A>>(Number.Ord), 0),
    ([map, acc], [gen, d]) => {
      if ((acc + d) / sum > acc / sum) return Function.tuple(map.set((acc + d) / sum, gen), acc + d);
      else return Function.tuple(map, acc);
    },
  );
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

/**
 * @tsplus pipeable fncts.test.Gen zip
 */
export function zip<R1, B>(that: Gen<R1, B>) {
  return <R, A>(self: Gen<R, A>): Gen<R | R1, readonly [A, B]> => {
    return self.zipWith(that, Function.tuple);
  };
}

/**
 * @tsplus static fncts.test.GenOps tuple
 */
export function tuple<A extends [...Gen<any, any>[]]>(
  ...components: A
): Gen<
  { [K in keyof A]: [A[K]] extends [Gen<infer R, any>] ? R : never }[keyof A & number],
  { [K in keyof A]: [A[K]] extends [Gen<any, infer A>] ? A : never }
> {
  return components.foldLeft(Gen.constant<Array<any>>([]) as Gen<any, ReadonlyArray<any>>, (b, a) =>
    b.zipWith(a, (vs, v) => [...vs, v]),
  ) as any;
}

/**
 * @tsplus static fncts.test.GenOps record
 */
export function record<R, R1, A>(
  key: Gen<R, string>,
  value: Gen<R1, A>,
  constraints?: LengthConstraints,
): Gen<Sized | R | R1, Record<string, A>> {
  return Gen.tuple(key, value)
    .uniqueConc({ eq: String.Eq.contramap(([k]) => k), ...constraints })
    .map((pairs) => pairs.foldLeft({} as Record<string, A>, (b, [k, v]) => ({ ...b, [k]: v })));
}

/**
 * @tsplus static fncts.test.GenOps date
 */
export function date(constraints: DateConstraints = {}): Gen<never, Date> {
  const min = constraints.min ? constraints.min.getTime() : -8_640_000_000_000_000;
  const max = constraints.max ? constraints.max.getTime() : 8_640_000_000_000_000;
  return Gen.intWith({ min, max }).map((n) => new Date(n));
}

function typedArray<A>(
  constraints: LengthConstraints & NumberConstraints,
  minBound: number,
  maxBound: number,
  ctor: { new (arg: ReadonlyArray<number>): A },
): Gen<Sized, A> {
  const min = constraints.min ? clamp(constraints.min, minBound, maxBound) : minBound;
  const max = constraints.max ? clamp(constraints.max, minBound, maxBound) : maxBound;
  return Gen.array(Gen.intWith({ min, max })).map((n) => new ctor(n));
}

/**
 * @tsplus static fncts.test.GenOps int8Array
 */
export function int8Array(constraints: LengthConstraints & NumberConstraints = {}): Gen<Sized, Int8Array> {
  return typedArray(constraints, -128, 127, Int8Array);
}

/**
 * @tsplus static fncts.test.GenOps int16Array
 */
export function int16Array(constraints: LengthConstraints & NumberConstraints = {}): Gen<Sized, Int16Array> {
  return typedArray(constraints, -32768, 32767, Int16Array);
}

/**
 * @tsplus static fncts.test.GenOps int32Array
 */
export function int32Array(constraints: LengthConstraints & NumberConstraints = {}): Gen<Sized, Int32Array> {
  return typedArray(constraints, -0x80000000, 0x7fffffff, Int32Array);
}

/**
 * @tsplus static fncts.test.GenOps uint8Array
 */
export function uint8Array(constraints: LengthConstraints & NumberConstraints = {}): Gen<Sized, Uint8Array> {
  return typedArray(constraints, 0, 255, Uint8Array);
}

/**
 * @tsplus static fncts.test.GenOps uint16Array
 */
export function uint16Array(constraints: LengthConstraints & NumberConstraints = {}): Gen<Sized, Uint16Array> {
  return typedArray(constraints, 0, 65535, Uint16Array);
}

/**
 * @tsplus static fncts.test.GenOps uint32Array
 */
export function uint32Array(constraints: LengthConstraints & NumberConstraints = {}): Gen<Sized, Uint32Array> {
  return typedArray(constraints, 0, 0xffffffff, Uint32Array);
}

function _char(min: number, max: number, mapToCode: (v: number) => number): Gen<never, string> {
  return Gen.intWith({ min, max }).map((n) => String.fromCharCode(mapToCode(n)));
}

function indexToPrintableIndex(v: number): number {
  return v < 95 ? v + 0x20 : v <= 0x7e ? v - 95 : v;
}

function base64ToCharCode(v: number): number {
  if (v < 26) return v + 65; // A-Z
  if (v < 52) return v + 97 - 26; // a-z
  if (v < 62) return v + 48 - 52; // 0-9
  return v === 62 ? 43 : 47; // +/
}

function hexToCharCode(v: number): number {
  return v < 10
    ? v + 48 // 0-9
    : v + 97 - 10; // a-f
}

function unicodeToCharCode(v: number): number {
  return v < 0xd800 ? indexToPrintableIndex(v) : v + gapSize;
}
