import type { Bounds } from "../Bounds.js";
import type { SyncOperator } from "./SyncOperator.js";

export const enum SyncLoopOperatorTag {
  Loop = "Loop",
  FilterMapLoop = "FilterMapLoop",
}

/**
 * @tsplus type fncts.io.Push.SyncLoopOperator
 */
export type SyncLoopOperator<B = any, A = any, C = any> = LoopOperator<B, A, C> | FilterMapLoopOperator<B, A, C>;

export interface LoopOperator<B, A, C> {
  readonly _tag: SyncLoopOperatorTag.Loop;
  readonly seed: B;
  readonly f: (acc: B, a: A) => readonly [C, B];
}

export function LoopOperator<const B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): LoopOperator<B, A, C> {
  return {
    _tag: SyncLoopOperatorTag.Loop,
    seed,
    f,
  };
}

export interface FilterMapLoopOperator<B, A, C> {
  readonly _tag: SyncLoopOperatorTag.FilterMapLoop;
  readonly seed: B;
  readonly f: (acc: B, a: A) => readonly [Maybe<C>, B];
}

export function FilterMapLoopOperator<const B, A, C>(
  seed: B,
  f: (acc: B, a: A) => readonly [Maybe<C>, B],
): FilterMapLoopOperator<B, A, C> {
  return {
    _tag: SyncLoopOperatorTag.FilterMapLoop,
    seed,
    f,
  };
}

export const enum SliceOperatorTag {
  SliceOperator,
  FilterMapSliceOperator,
}

export interface SliceOperator {
  readonly _tag: SliceOperatorTag.SliceOperator;
  readonly bounds: Bounds;
}

export function SliceOperator(bounds: Bounds): SliceOperator {
  return {
    _tag: SliceOperatorTag.SliceOperator,
    bounds,
  };
}

export interface FilterMapSliceOperator<A, B, C> {
  readonly _tag: SliceOperatorTag.FilterMapSliceOperator;
  readonly seed: B;
  readonly f: (acc: B, a: A) => Either<readonly [Maybe<C>, B], Maybe<C>>;
}

export function FilterMapSliceOperator<const B, A, C>(
  seed: B,
  f: (acc: B, a: A) => Either<readonly [Maybe<C>, B], Maybe<C>>,
): FilterMapSliceOperator<A, B, C> {
  return {
    _tag: SliceOperatorTag.FilterMapSliceOperator,
    seed,
    f,
  };
}

/**
 * @tsplus pipeable fncts.io.Push.SyncLoopOperator match
 */
export function matchSyncLoopOperator<A, B, C, D, E>(matchers: {
  Loop: (op: LoopOperator<A, B, C>) => D;
  FilterMapLoop: (op: FilterMapLoopOperator<A, B, C>) => E;
}) {
  return (self: SyncLoopOperator<A, B, C>): D | E => {
    switch (self._tag) {
      case SyncLoopOperatorTag.Loop:
        return matchers.Loop(self);
      case SyncLoopOperatorTag.FilterMapLoop:
        return matchers.FilterMapLoop(self);
    }
  };
}

export function fuseSyncOperatorBefore(that: SyncOperator) {
  return (self: SyncLoopOperator): SyncLoopOperator => {
    return that.match({
      Map: (op) =>
        self.match({
          Loop: (lop) => LoopOperator(lop.seed, (acc, a) => lop.f(acc, op.f(a))),
          FilterMapLoop: (lop) => FilterMapLoopOperator(lop.seed, (acc, a) => lop.f(acc, op.f(a))),
        }),
      Filter: (op) =>
        self.match({
          Loop: (lop) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              if (op.f(a)) {
                return [Just(b), c];
              } else {
                return [Nothing(), c];
              }
            }),
          FilterMapLoop: (lop) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              if (op.f(a)) {
                return [Nothing(), acc];
              } else {
                return lop.f(acc, a);
              }
            }),
        }),
      FilterMap: (op) =>
        self.match({
          Loop: (lop) =>
            FilterMapLoopOperator(lop.seed, (acc, a) =>
              op.f(a).match(
                () => [Nothing(), acc],
                (x) => {
                  const [b, c] = lop.f(acc, x);
                  return [Just(b), c];
                },
              ),
            ),
          FilterMapLoop: (lop) =>
            FilterMapLoopOperator(lop.seed, (acc, a) =>
              op.f(a).match(
                () => [Nothing(), acc],
                (x) => lop.f(acc, x.value),
              ),
            ),
        }),
    });
  };
}

export function fuseSyncOperatorAfter(that: SyncOperator) {
  return (self: SyncLoopOperator): SyncLoopOperator =>
    self.match({
      Loop: (lop) =>
        that.match({
          Map: (op) =>
            LoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              return [op.f(b), c];
            }),
          Filter: (op) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              if (op.f(b)) {
                return [Just(b), c];
              } else {
                return [Nothing(), c];
              }
            }),
          FilterMap: (op) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              return op.f(b).match(
                () => [Nothing(), c],
                (d) => [Just(d), c],
              );
            }),
        }),
      FilterMapLoop: (lop) =>
        that.match({
          Map: (op) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              return [b.map(op.f), c];
            }),
          Filter: (op) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              return [b.filter(op.f), c];
            }),
          FilterMap: (op) =>
            FilterMapLoopOperator(lop.seed, (acc, a) => {
              const [b, c] = lop.f(acc, a);
              return [b.flatMap(op.f), c];
            }),
        }),
    });
}

export function fuse<C, D, E>(that: SyncLoopOperator<D, C, E>) {
  return <A, B>(self: SyncLoopOperator<A, B, C>): SyncLoopOperator<readonly [A, D], B, E> => {
    return self.match({
      Loop: (op1) =>
        that.match({
          Loop: (op2) =>
            LoopOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              const [e, d1] = op2.f(d, c);
              return [e, [a1, d1]];
            }),
          FilterMapLoop: (op2) =>
            FilterMapLoopOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              const [e, d1] = op2.f(d, c);
              return [e, [a1, d1]];
            }),
        }),
      FilterMapLoop: (op1) =>
        that.match({
          Loop: (op2) =>
            FilterMapLoopOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              return c.match(
                () => [Nothing(), [a1, d]],
                (c) => {
                  const [e, d1] = op2.f(d, c);
                  return [Just(e), [a1, d1]];
                },
              );
            }),
          FilterMapLoop: (op2) =>
            FilterMapLoopOperator([op1.seed, op2.seed], ([a, d], b) => {
              const [c, a1] = op1.f(a, b);
              return c.match(
                () => [Nothing(), [a1, d]],
                (c) => {
                  const [e, d1] = op2.f(d, c);
                  return [e, [a1, d1]];
                },
              );
            }),
        }),
    });
  };
}
