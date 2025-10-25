import type { SyncOperator } from "./SyncOperator.js";

export const enum IOOperatorTag {
  MapIO = "MapIO",
  TapIO = "TapIO",
  FilterIO = "FilterIO",
  FilterMapIO = "FilterMapIO",
}

/**
 * @tsplus type fncts.io.Push.IOOperator
 * @tsplus companion fncts.io.Push.IOOperatorOps
 */
export type IOOperator =
  | MapIO<any, any, any, any>
  | TapIO<any, any, any, any>
  | FilterIO<any, any, any>
  | FilterMapIO<any, any, any, any>;

export interface MapIO<R, E, A, B> {
  readonly _tag: IOOperatorTag.MapIO;
  readonly f: (a: A) => IO<R, E, B>;
}

export function MapIO<R, E, A, B>(f: (a: A) => IO<R, E, B>): MapIO<R, E, A, B> {
  return {
    _tag: IOOperatorTag.MapIO,
    f,
  };
}

export interface TapIO<R, E, A, B> {
  readonly _tag: IOOperatorTag.TapIO;
  readonly f: (a: A) => IO<R, E, B>;
}

export function TapIO<R, E, A, B>(f: (a: A) => IO<R, E, B>): TapIO<R, E, A, B> {
  return {
    _tag: IOOperatorTag.TapIO,
    f,
  };
}

export interface FilterIO<R, E, A> {
  readonly _tag: IOOperatorTag.FilterIO;
  readonly f: (a: A) => IO<R, E, boolean>;
}

export function FilterIO<R, E, A>(f: (a: A) => IO<R, E, boolean>): FilterIO<R, E, A> {
  return {
    _tag: IOOperatorTag.FilterIO,
    f,
  };
}

export interface FilterMapIO<R, E, A, B> {
  readonly _tag: IOOperatorTag.FilterMapIO;
  readonly f: (a: A) => IO<R, E, Maybe<B>>;
}

export function FilterMapIO<R, E, A, B>(f: (a: A) => IO<R, E, Maybe<B>>): FilterMapIO<R, E, A, B> {
  return {
    _tag: IOOperatorTag.FilterMapIO,
    f,
  };
}

export type IOOperatorFusionMap = {
  readonly [K in IOOperator["_tag"]]: {
    readonly [K2 in IOOperator["_tag"]]: (
      op1: Extract<IOOperator, { readonly _tag: K }>,
      op2: Extract<IOOperator, { readonly _tag: K2 }>,
    ) => IOOperator;
  };
};

const IOOperatorFusionMap: IOOperatorFusionMap = {
  [IOOperatorTag.MapIO]: {
    [IOOperatorTag.MapIO]: (op1, op2) => MapIO((a) => op1.f(a).flatMap(op2.f)),
    [IOOperatorTag.TapIO]: (op1, op2) => MapIO((a) => op1.f(a).tap(op2.f)),
    [IOOperatorTag.FilterIO]: (op1, op2) =>
      FilterMapIO((a) => op1.f(a).flatMap((b) => op2.f(b).map((b2) => (b2 ? Just(b) : Nothing())))),
    [IOOperatorTag.FilterMapIO]: (op1, op2) => FilterMapIO((a) => op1.f(a).flatMap(op2.f)),
  },
  [IOOperatorTag.TapIO]: {
    [IOOperatorTag.MapIO]: (op1, op2) => MapIO((a) => op1.f(a).flatMap(() => op2.f(a))),
    [IOOperatorTag.TapIO]: (op1, op2) => TapIO((a) => op1.f(a).tap(() => op2.f(a))),
    [IOOperatorTag.FilterIO]: (op1, op2) => FilterIO((a) => op1.f(a).flatMap(() => op2.f(a))),
    [IOOperatorTag.FilterMapIO]: (op1, op2) => FilterMapIO((a) => op1.f(a).flatMap(() => op2.f(a))),
  },
  [IOOperatorTag.FilterIO]: {
    [IOOperatorTag.MapIO]: (op1, op2) =>
      FilterMapIO((a) => op1.f(a).flatMap((b) => (b ? op2.f(a).map(Maybe.just) : IO.succeedNow(Nothing())))),
    [IOOperatorTag.TapIO]: (op1, op2) => FilterIO((a) => op1.f(a).tap(() => op2.f(a))),
    [IOOperatorTag.FilterIO]: (op1, op2) => FilterIO((a) => op1.f(a).zipWith(op2.f(a), (b1, b2) => b1 && b2)),
    [IOOperatorTag.FilterMapIO]: (op1, op2) =>
      FilterMapIO((a) => op1.f(a).flatMap((b) => (b ? op2.f(a) : IO.succeedNow(Nothing())))),
  },
  [IOOperatorTag.FilterMapIO]: {
    [IOOperatorTag.MapIO]: (op1, op2) =>
      FilterMapIO((a) => op1.f(a).flatMap((mb) => mb.match(() => IO.succeedNow(Nothing()), op2.f))),
    [IOOperatorTag.TapIO]: (op1, op2) =>
      FilterMapIO((a) =>
        op1.f(a).flatMap((mb) =>
          mb.match(
            () => IO.succeedNow(Nothing()),
            (b) => op2.f(b).as(() => a),
          ),
        ),
      ),
    [IOOperatorTag.FilterIO]: (op1, op2) =>
      FilterMapIO((a) =>
        op1.f(a).flatMap((mb) =>
          mb.match(
            () => IO.succeedNow(Nothing()),
            (b) => op2.f(b).map((b2) => (b2 ? Just(b) : Nothing())),
          ),
        ),
      ),
    [IOOperatorTag.FilterMapIO]: (op1, op2) =>
      FilterMapIO((a) =>
        op1.f(a).flatMap((mb) =>
          mb.match(
            () => IO.succeedNow(Nothing()),
            (b) => op2.f(b),
          ),
        ),
      ),
  },
};

/**
 * @tsplus pipeable fncts.io.Push.IOOperator fuse
 */
export function fuse(that: IOOperator) {
  return (self: IOOperator): IOOperator => {
    return IOOperatorFusionMap[self._tag][that._tag](self as any, that as any);
  };
}

/**
 * @tsplus static fncts.io.Push.IOOperatorOps fromSyncOperator
 */
export function fromSyncOperator(op: SyncOperator): IOOperator {
  return op.match({
    Map: (op) => MapIO((a) => IO.succeedNow(op.f(a))),
    Filter: (op) => FilterIO((a) => IO.succeedNow(op.f(a))),
    FilterMap: (op) => FilterMapIO((a) => IO.succeedNow(op.f(a))),
  });
}

/**
 * @tsplus pipeable fncts.io.Push.IOOperator match
 */
export function match<A, B, C, D>(cases: {
  readonly MapIO: (f: MapIO<any, any, any, any>) => A;
  readonly TapIO: (f: TapIO<any, any, any, any>) => B;
  readonly FilterIO: (f: FilterIO<any, any, any>) => C;
  readonly FilterMapIO: (f: FilterMapIO<any, any, any, any>) => D;
}) {
  return (self: IOOperator): A | B | C | D => {
    switch (self._tag) {
      case IOOperatorTag.MapIO:
        return cases.MapIO(self);
      case IOOperatorTag.TapIO:
        return cases.TapIO(self);
      case IOOperatorTag.FilterIO:
        return cases.FilterIO(self);
      case IOOperatorTag.FilterMapIO:
        return cases.FilterMapIO(self);
    }
  };
}
