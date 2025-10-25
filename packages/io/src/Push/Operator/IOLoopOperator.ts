import type { IOOperator } from "./IOOperator.js";
import type { SyncLoopOperator } from "@fncts/io/Push/Operator/LoopOperator";
import type { SyncOperator } from "@fncts/io/Push/Operator/SyncOperator";

export const enum IOLoopOperatorTag {
  LoopIO = "LoopIO",
  FilterMapLoopIO = "FilterMapLoopIO",
}

/**
 * @tsplus type fncts.io.Push.IOLoopOperator
 */
export type IOLoopOperator<B = any, A = any, R = any, E = any, C = any> =
  | LoopIOOperator<B, A, R, E, C>
  | FilterMapLoopIOOperator<B, A, R, E, C>;

export interface LoopIOOperator<B, A, R, E, C> {
  readonly _tag: IOLoopOperatorTag.LoopIO;
  readonly seed: B;
  readonly f: (acc: B, a: A) => IO<R, E, readonly [C, B]>;
}

export function LoopIOOperator<const B, A, R, E, C>(
  seed: B,
  f: (acc: B, a: A) => IO<R, E, readonly [C, B]>,
): LoopIOOperator<B, A, R, E, C> {
  return {
    _tag: IOLoopOperatorTag.LoopIO,
    seed,
    f,
  };
}

export interface FilterMapLoopIOOperator<B, A, R, E, C> {
  readonly _tag: IOLoopOperatorTag.FilterMapLoopIO;
  readonly seed: B;
  readonly f: (acc: B, a: A) => IO<R, E, readonly [Maybe<C>, B]>;
}

export function FilterMapLoopIOOperator<const B, A, R, E, C>(
  seed: B,
  f: (acc: B, a: A) => IO<R, E, readonly [Maybe<C>, B]>,
): FilterMapLoopIOOperator<B, A, R, E, C> {
  return {
    _tag: IOLoopOperatorTag.FilterMapLoopIO,
    seed,
    f,
  };
}

/**
 * @tsplus pipeable fncts.io.Push.IOLoopOperator match
 */
export function match<B, A, R, E, C, D, F>(matchers: {
  LoopIO: (op: LoopIOOperator<B, A, R, E, C>) => D;
  FilterMapLoopIO: (op: FilterMapLoopIOOperator<B, A, R, E, C>) => F;
}) {
  return (self: IOLoopOperator<B, A, R, E, C>): D | F => {
    switch (self._tag) {
      case IOLoopOperatorTag.LoopIO:
        return matchers.LoopIO(self);
      case IOLoopOperatorTag.FilterMapLoopIO:
        return matchers.FilterMapLoopIO(self);
    }
  };
}

/**
 * @tsplus pipeable fncts.io.Push.IOLoopOperator fuse
 */
export function fuse<C, D, F, R2, E2>(that: IOLoopOperator<D, C, R2, E2, F>) {
  return <A, B, R1, E1>(
    self: IOLoopOperator<A, B, R1, E1, C>,
  ): IOLoopOperator<readonly [A, D], B, R1 | R2, E1 | E2, F> =>
    self.match({
      LoopIO: (op1) =>
        that.match({
          LoopIO: (op2) =>
            LoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).flatMap(([c, a1]) => op2.f(d, c).map(([f, d1]) => [f, [a1, d1]])),
            ),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).flatMap(([c, a1]) => op2.f(d, c).map(([f, d1]) => [f, [a1, d1]])),
            ),
        }),
      FilterMapLoopIO: (op1) =>
        that.match({
          LoopIO: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).flatMap(([c, a1]) =>
                c.match(
                  () => [Nothing(), [a1, d]] as const,
                  (c) => op2.f(d, c).map(([f, d1]) => [Just(f), [a1, d1]]),
                ),
              ),
            ),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).flatMap(([c, a1]) =>
                c.match(
                  () => [Nothing(), [a1, d]] as const,
                  (c) => op2.f(d, c).map(([f, d1]) => [f, [a1, d1]]),
                ),
              ),
            ),
        }),
    });
}

/**
 * @tsplus pipeable fncts.io.Push.IOLoopOperator after
 */
export function fuseSyncLoopOperatorBefore<A, B, C>(that: SyncLoopOperator<A, B, C>) {
  return <D, R, E, F>(self: IOLoopOperator<D, C, R, E, F>): IOLoopOperator<readonly [A, D], B, R, E, F> =>
    that.match({
      Loop: (op1) =>
        self.match({
          LoopIO: (op2) =>
            LoopIOOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              return op2.f(d, c).map(([f, d1]) => [f, [a1, d1]]);
            }),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              return op2.f(d, c).map(([f, d1]) => [f, [a1, d1]]);
            }),
        }),
      FilterMapLoop: (op1) =>
        self.match({
          LoopIO: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              return c.match(
                () => IO.succeedNow([Nothing(), [a1, d]]),
                (c) => op2.f(d, c).map(([f, d1]) => [Just(f), [a1, d1]]),
              );
            }),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              return c.match(
                () => IO.succeedNow([Nothing(), [a1, d]]),
                (c) => op2.f(d, c).map(([f, d1]) => [f, [a1, d1]]),
              );
            }),
        }),
    });
}

/**
 * @tsplus pipeable fncts.io.Push.IOLoopOperator before
 */
export function fuseSyncLoopOperatorAfter<D, C, F>(that: SyncLoopOperator<D, C, F>) {
  return <A, B, R, E>(self: IOLoopOperator<A, B, R, E, C>): IOLoopOperator<readonly [A, D], B, R, E, F> =>
    self.match({
      LoopIO: (op1) =>
        that.match({
          Loop: (op2) =>
            LoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).map(([c, a1]) => {
                const [f, d1] = op2.f(d, c);
                return [f, [a1, d1]];
              }),
            ),
          FilterMapLoop: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).map(([c, a1]) => {
                const [f, d1] = op2.f(d, c);
                return [f, [a1, d1]];
              }),
            ),
        }),
      FilterMapLoopIO: (op1) =>
        that.match({
          Loop: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).map(([c, a1]) =>
                c.match(
                  () => [Nothing(), [a1, d]],
                  (c) => {
                    const [f, d1] = op2.f(d, c);
                    return [Just(f), [a1, d1]];
                  },
                ),
              ),
            ),
          FilterMapLoop: (op2) =>
            FilterMapLoopIOOperator([op1.seed, op2.seed], ([a, d], b) =>
              op1.f(a, b).map(([c, a1]) =>
                c.match(
                  () => [Nothing(), [a1, d]],
                  (c) => {
                    const [f, d1] = op2.f(d, c);
                    return [f, [a1, d1]];
                  },
                ),
              ),
            ),
        }),
    });
}

/**
 * @tsplus pipeable fncts.io.Push.IOLoopOperator after
 */
export function fuseSyncOperatorBefore(that: SyncOperator) {
  return (self: IOLoopOperator): IOLoopOperator =>
    that.match({
      Map: (op) =>
        self.match({
          LoopIO: (op2) => LoopIOOperator(op2.seed, (acc, a) => op2.f(acc, op.f(a))),
          FilterMapLoopIO: (op2) => FilterMapLoopIOOperator(op2.seed, (acc, a) => op2.f(acc, op.f(a))),
        }),
      Filter: (op) =>
        self.match({
          LoopIO: (op2) =>
            LoopIOOperator(op2.seed, (acc, a) => {
              if (op.f(a)) {
                return op2.f(acc, a);
              } else {
                return IO.succeedNow([Nothing(), acc]);
              }
            }),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator(op2.seed, (acc, a) => {
              if (op.f(a)) {
                return op2.f(acc, a);
              } else {
                return IO.succeedNow([Nothing(), acc]);
              }
            }),
        }),
      FilterMap: (op) =>
        self.match({
          LoopIO: (op2) =>
            LoopIOOperator(op2.seed, (acc, a) =>
              op.f(a).match(
                () => IO.succeedNow([Nothing(), acc] as const),
                (b) => self.f(acc, b),
              ),
            ),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator(op2.seed, (acc, a) =>
              op.f(a).match(
                () => IO.succeedNow([Nothing(), acc] as const),
                (b) => self.f(acc, b),
              ),
            ),
        }),
    });
}

/**
 * @tsplus pipeable fncts.io.Push.IOLoopOperator before
 */
export function fuseSyncOperatorAfter(that: SyncOperator) {
  return (self: IOLoopOperator): IOLoopOperator =>
    self.match({
      LoopIO: (op1) =>
        that.match({
          Map: (op) => LoopIOOperator(op1.seed, (acc, a) => op1.f(acc, a).map(([b, c]) => [op.f(b), c] as const)),
          Filter: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).map(([b, c]) => [Maybe.fromPredicate(b, op.f), c] as const),
            ),
          FilterMap: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) => op1.f(acc, a).map(([b, c]) => [op.f(b), c] as const)),
        }),
      FilterMapLoopIO: (op1) =>
        that.match({
          Map: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) => op1.f(acc, a).map(([b, c]) => [b.map(op.f), c] as const)),
          Filter: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) => op1.f(acc, a).map(([b, c]) => [b.filter(op.f), c] as const)),
          FilterMap: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) => op1.f(acc, a).map(([b, c]) => [b.flatMap(op.f), c] as const)),
        }),
    });
}

export function fuseIOOperatorBefore(that: IOOperator) {
  return (self: IOLoopOperator): IOLoopOperator =>
    that.match({
      MapIO: (op) =>
        self.match({
          LoopIO: (op2) => LoopIOOperator(op2.seed, (acc, a) => op.f(a).flatMap((b) => op2.f(acc, b))),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator(op2.seed, (acc, a) => op.f(a).flatMap((b) => op2.f(acc, b))),
        }),
      TapIO: (op) =>
        self.match({
          LoopIO: (op2) => LoopIOOperator(op2.seed, (acc, a) => op.f(a).flatMap(() => op2.f(acc, a))),
          FilterMapLoopIO: (op2) => FilterMapLoopIOOperator(op2.seed, (acc, a) => op.f(a).flatMap(() => op2.f(acc, a))),
        }),
      FilterIO: (op) =>
        self.match({
          LoopIO: (op2) =>
            LoopIOOperator(op2.seed, (acc, a) =>
              op.f(a).flatMap((b) => {
                if (b) {
                  return op2.f(acc, a);
                } else {
                  return IO.succeedNow([Nothing(), acc] as const);
                }
              }),
            ),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator(op2.seed, (acc, a) =>
              op.f(a).flatMap((b) => {
                if (b) {
                  return op2.f(acc, a);
                } else {
                  return IO.succeedNow([Nothing(), acc] as const);
                }
              }),
            ),
        }),
      FilterMapIO: (op) =>
        self.match({
          LoopIO: (op2) =>
            LoopIOOperator(op2.seed, (acc, a) =>
              op.f(a).flatMap((b) =>
                b.match(
                  () => IO.succeedNow([Nothing(), acc] as const),
                  (c) => op2.f(acc, c),
                ),
              ),
            ),
          FilterMapLoopIO: (op2) =>
            FilterMapLoopIOOperator(op2.seed, (acc, a) =>
              op.f(a).flatMap((b) =>
                b.match(
                  () => IO.succeedNow([Nothing(), acc] as const),
                  (c) => op2.f(acc, c),
                ),
              ),
            ),
        }),
    });
}

export function fuseIOOperatorAfter(that: IOOperator) {
  return (self: IOLoopOperator) =>
    self.match({
      LoopIO: (op1) =>
        that.match({
          MapIO: (op) =>
            LoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).flatMap(([b, c]) => op.f(b).map((d) => [d, c] as const)),
            ),
          TapIO: (op) =>
            LoopIOOperator(op1.seed, (acc, a) => op1.f(acc, a).flatMap(([b, c]) => op.f(b).map(() => [b, c] as const))),
          FilterIO: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1
                .f(acc, a)
                .flatMap(([b, c]) => op.f(b).map((d) => (d ? ([Just(b), c] as const) : ([Nothing(), c] as const)))),
            ),
          FilterMapIO: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).flatMap(([b, c]) => op.f(b).map((d) => [d, c] as const)),
            ),
        }),
      FilterMapLoopIO: (op1) =>
        that.match({
          MapIO: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).flatMap(([b, c]) =>
                b.match(
                  () => IO.succeedNow([Nothing(), c] as const),
                  (d) => op.f(d).map((e) => [Just(e), c] as const),
                ),
              ),
            ),
          TapIO: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).flatMap(([b, c]) =>
                b.match(
                  () => IO.succeedNow([Nothing(), c] as const),
                  (d) => op.f(d).map(() => [Just(d), c] as const),
                ),
              ),
            ),
          FilterIO: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).flatMap(([b, c]) =>
                b.match(
                  () => IO.succeedNow([Nothing(), c] as const),
                  (d) => op.f(d).map((e) => (e ? ([Just(d), c] as const) : ([Nothing(), c] as const))),
                ),
              ),
            ),
          FilterMapIO: (op) =>
            FilterMapLoopIOOperator(op1.seed, (acc, a) =>
              op1.f(acc, a).flatMap(([b, c]) =>
                b.match(
                  () => IO.succeedNow([Nothing(), c] as const),
                  (d) => op.f(d).map((e) => [e, c] as const),
                ),
              ),
            ),
        }),
    });
}

export function liftLoopOperator(self: SyncLoopOperator): IOLoopOperator {
  return self.match({
    Loop: (op) => LoopIOOperator(op.seed, (acc, a) => IO.succeedNow(op.f(acc, a))),
    FilterMapLoop: (op) => FilterMapLoopIOOperator(op.seed, (acc, a) => IO.succeedNow(op.f(acc, a))),
  });
}
