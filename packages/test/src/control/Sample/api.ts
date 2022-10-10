import type { ArrayInt64 } from "@fncts/base/util/rand";

import { constVoid, identity, tuple } from "@fncts/base/data/function";
import { ChildExecutorDecision } from "@fncts/io/Channel/ChildExecutorDecision";
import { UpstreamPullStrategy } from "@fncts/io/Channel/UpstreamPullStrategy";

import { add64, halve64, isEqual64, substract64 } from "../../util/math.js";
import { Sample } from "./definition.js";

/**
 * @tsplus pipeable fncts.test.Sample flatMap
 */
export function flatMap<A, R1, B>(f: (a: A) => Sample<R1, B>) {
  return <R>(ma: Sample<R, A>): Sample<R | R1, B> => {
    const sample = f(ma.value);
    return new Sample(
      sample.value,
      mergeStream(
        sample.shrink,
        ma.shrink.map((maybeSample) => maybeSample.map((sample) => sample.flatMap(f))),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.Sample filter
 */
export function filter<A>(f: Predicate<A>) {
  return <R>(ma: Sample<R, A>): Stream<R, never, Maybe<Sample<R, A>>> => {
    if (f(ma.value)) {
      return Stream.succeedNow(
        Just(
          new Sample(
            ma.value,
            ma.shrink.flatMap((maybeSample) => maybeSample.map((sample) => sample.filter(f)).getOrElse(Stream.empty)),
          ),
        ),
      );
    } else {
      return ma.shrink.flatMap((maybeSample) => maybeSample.map((sample) => sample.filter(f)).getOrElse(Stream.empty));
    }
  };
}

/**
 * @tsplus pipeable fncts.test.Sample foreach
 */
export function foreach<A, R1, B>(f: (a: A) => IO<R1, never, B>) {
  return <R>(ma: Sample<R, A>): IO<R | R1, never, Sample<R | R1, B>> => {
    return f(ma.value).map(
      (b) =>
        new Sample(
          b,
          ma.shrink.mapIO((maybeSample) =>
            maybeSample.match(
              () => IO.succeedNow(Nothing()),
              (sample) => sample.foreach(f).map((value) => Just(value)),
            ),
          ),
        ),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.Sample map
 */
export function map<A, B>(f: (a: A) => B) {
  return <R>(ma: Sample<R, A>): Sample<R, B> => {
    return new Sample(
      f(ma.value),
      ma.shrink.map((v) => v.map((sample) => sample.map(f))),
    );
  };
}

/**
 * @tsplus pipeable fncts.test.Sample shrinkSearch
 */
export function shrinkSearch<A>(p: Predicate<A>) {
  return <R>(ma: Sample<R, A>): Stream<R, never, A> => {
    if (!p(ma.value)) {
      return Stream.succeedNow(ma.value);
    } else {
      return Stream.succeedNow(ma.value).concat(
        ma.shrink
          .takeUntil((maybeSample) =>
            maybeSample.match(
              () => false,
              (v) => p(v.value),
            ),
          )
          .flatMap((maybeSample) => maybeSample.map((sample) => sample.shrinkSearch(p)).getOrElse(() => Stream.empty)),
      );
    }
  };
}

/**
 * @tsplus static fncts.test.SampleOps unfold
 */
export function unfold<R, A, S>(s: S, f: (s: S) => readonly [A, Stream<R, never, S>]): Sample<R, A> {
  const [value, shrink] = f(s);
  return new Sample(
    value,
    shrink.map((s) => Just(Sample.unfold(s, f))),
  );
}

/**
 * @tsplus pipeable fncts.test.Sample zip
 */
export function zip<R1, B>(mb: Sample<R1, B>) {
  return <R, A>(ma: Sample<R, A>): Sample<R | R1, readonly [A, B]> => {
    return ma.zipWith(mb, tuple);
  };
}

/**
 * @tsplus pipeable fncts.test.Sample zipWith
 */
export function zipWith<A, R1, B, C>(mb: Sample<R1, B>, f: (a: A, b: B) => C) {
  return <R>(ma: Sample<R, A>): Sample<R | R1, C> => {
    return ma.flatMap((a) => mb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus static fncts.test.SampleOps noShrink
 */
export function noShrink<A>(a: A): Sample<never, A> {
  return new Sample(a, Stream.empty);
}

/**
 * @tsplus static fncts.test.SampleOps shrinkFractional
 */
export function shrinkFractional(smallest: number): (a: number) => Sample<never, number> {
  return (a) =>
    Sample.unfold(a, (max) =>
      tuple(
        max,
        Stream.unfold(smallest, (min) => {
          const mid = min + (max - min) / 2;
          if (mid === max) {
            return Nothing();
          } else if (Math.abs(max - mid) < 0.001) {
            return Just([min, max]);
          } else {
            return Just([mid, mid]);
          }
        }),
      ),
    );
}

function quot(x: number, y: number): number {
  return (x / y) | 0;
}

function bigIntAbs(x: bigint): bigint {
  return x < BigInt(0) ? -x : x;
}

/**
 * @tsplus static fncts.test.SampleOps shrinkBigInt
 */
export function shrinkBigInt(smallest: bigint): (a: bigint) => Sample<never, bigint> {
  return (a) =>
    Sample.unfold(a, (max) =>
      tuple(
        max,
        Stream.unfold(smallest, (min) => {
          const mid = min + (max - min) / BigInt(2);
          if (mid === max) {
            return Nothing();
          } else if (bigIntAbs(max - mid) === BigInt(1)) {
            return Just([mid, max]);
          } else {
            return Just([mid, mid]);
          }
        }),
      ),
    );
}

/**
 * @tsplus static fncts.test.SampleOps shrinkIntegral
 */
export function shrinkIntegral(smallest: number): (a: number) => Sample<never, number> {
  return (a) =>
    Sample.unfold(a, (max) =>
      tuple(
        max,
        Stream.unfold(smallest, (min) => {
          const mid = min + quot(max - min, 2);
          if (mid === max) {
            return Nothing();
          } else if (Math.abs(max - mid) === 1) {
            return Just([mid, max]);
          } else {
            return Just([mid, mid]);
          }
        }),
      ),
    );
}

/**
 * @tsplus static fncts.test.SampleOps shrinkArrayInt64
 */
export function shrinkArrayInt64(target: ArrayInt64): (value: ArrayInt64) => Sample<never, ArrayInt64> {
  return (value) =>
    Sample.unfold(value, (max) =>
      tuple(
        max,
        Stream.unfold(target, (min) => {
          const mid = add64(min, halve64(substract64(max, min)));
          if (isEqual64(mid, max)) {
            return Nothing();
          } else {
            return Just([mid, max]);
          }
        }),
      ),
    );
}

function mergeStream<R, A, R1, B>(
  left: Stream<R, never, Maybe<A>>,
  right: Stream<R1, never, Maybe<B>>,
): Stream<R | R1, never, Maybe<A | B>> {
  return flatMapStream(Stream.fromChunk(Conc(Just<Stream<R | R1, never, Maybe<A | B>>>(left), Just(right))), identity);
}

/**
 * @tsplus static fncts.test.SampleOps flatMapStream
 */
export function flatMapStream<R, A, R1, B>(
  stream: Stream<R, never, Maybe<A>>,
  f: (a: A) => Stream<R1, never, Maybe<B>>,
): Stream<R | R1, never, Maybe<B>> {
  return new Stream(
    stream.rechunk(1).channel.concatMapWithCustom(
      (values) =>
        values
          .map((maybeValue) =>
            maybeValue.match(
              () => Stream.succeedNow(Either.left(false)).channel,
              (value) =>
                f(value)
                  .rechunk(1)
                  .map((maybeB) => maybeB.match(() => Either.left(true), Either.right)).channel,
            ),
          )
          .foldLeft(
            Channel.unit as Channel<R1, unknown, unknown, unknown, never, Conc<Either<boolean, B>>, unknown>,
            (a, b) => a.apSecond(b),
          ),
      constVoid,
      constVoid,
      (upr) =>
        upr.match(
          (value) =>
            value.head.flatten.match(
              () => UpstreamPullStrategy.PullAfterAllEnqueued(Nothing()),
              () => UpstreamPullStrategy.PullAfterNext(Nothing()),
            ),
          (activeDownstreamCount) =>
            UpstreamPullStrategy.PullAfterAllEnqueued(
              activeDownstreamCount > 0 ? Just(Conc.single(Either.left(false))) : Nothing(),
            ),
        ),
      (chunk: Conc<Either<boolean, B>>) =>
        chunk.head.match(
          () => ChildExecutorDecision.Continue,
          (r) =>
            r.match(
              (b) => (b ? ChildExecutorDecision.Yield : ChildExecutorDecision.Continue),
              () => ChildExecutorDecision.Continue,
            ),
        ),
    ),
  )
    .filter((r) =>
      r.match(
        (b) => !b,
        () => true,
      ),
    )
    .map((r) =>
      r.match(
        () => Nothing(),
        (b) => Just(b),
      ),
    );
}
