import type { Cause } from "../../data/Cause.js";
import type { Managed } from "../Managed.js";

export const LayerHash = Symbol.for("fncts.control.Layer.Hash");
export type LayerHash = typeof LayerHash;

/**
 * @tsplus type fncts.control.Layer
 * @tsplus companion fncts.control.LayerOps
 */
export abstract class Layer<RIn, E, ROut> {
  readonly _R!: (_: RIn) => void;
  readonly _E!: () => E;
  readonly _A!: () => ROut;

  [LayerHash]: PropertyKey = Symbol();

  setKey(hash: PropertyKey): this {
    this[LayerHash] = hash;
    return this;
  }
}

export type Concrete =
  | Fold<any, any, any, any, any, any, any, any, any>
  | Fresh<any, any, any>
  | FromManaged<any, any, any>
  | Defer<any, any, any>
  | To<any, any, any, any, any>
  | ZipWith<any, any, any, any, any, any, any>
  | ZipWithC<any, any, any, any, any, any, any>;

/**
 * @tsplus fluent fncts.control.Layer concrete
 */
export function concrete(self: Layer<any, any, any>): asserts self is Concrete {
  //
}

export const enum LayerTag {
  Fold = "Fold",
  Fresh = "Fresh",
  Managed = "Managed",
  Defer = "Defer",
  To = "To",
  ZipWith = "ZipWith",
  ZipWithC = "ZipWithC",
}

export class Fold<RIn, E, ROut, RIn1, E1, ROut1, RIn2, E2, ROut2> extends Layer<
  RIn & RIn1 & RIn2,
  E1 | E2,
  ROut1 | ROut2
> {
  readonly _tag = LayerTag.Fold;

  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly failure: (cause: Cause<E>) => Layer<RIn1, E1, ROut1>,
    readonly success: (r: ROut) => Layer<RIn2, E2, ROut2>,
  ) {
    super();
  }
}

export class Fresh<RIn, E, ROut> extends Layer<RIn, E, ROut> {
  readonly _tag = LayerTag.Fresh;
  constructor(readonly self: Layer<RIn, E, ROut>) {
    super();
  }
}

export class FromManaged<RIn, E, ROut> extends Layer<RIn, E, ROut> {
  readonly _tag = LayerTag.Managed;
  constructor(readonly self: Managed<RIn, E, ROut>) {
    super();
  }
}

export class Defer<RIn, E, ROut> extends Layer<RIn, E, ROut> {
  readonly _tag = LayerTag.Defer;
  constructor(readonly self: () => Layer<RIn, E, ROut>) {
    super();
  }
}

export class To<RIn, E, ROut, E1, ROut1> extends Layer<RIn, E | E1, ROut1> {
  readonly _tag = LayerTag.To;
  constructor(readonly self: Layer<RIn, E, ROut>, readonly that: Layer<ROut, E1, ROut1>) {
    super();
  }
}

export class ZipWith<RIn, E, ROut, RIn1, E1, ROut1, ROut2> extends Layer<
  RIn & RIn1,
  E | E1,
  ROut2
> {
  readonly _tag = LayerTag.ZipWith;
  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly that: Layer<RIn1, E1, ROut1>,
    readonly f: (a: ROut, b: ROut1) => ROut2,
  ) {
    super();
  }
}

export class ZipWithC<RIn, E, ROut, RIn1, E1, ROut1, ROut2> extends Layer<
  RIn & RIn1,
  E | E1,
  ROut2
> {
  readonly _tag = LayerTag.ZipWithC;
  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly that: Layer<RIn1, E1, ROut1>,
    readonly f: (a: ROut, b: ROut1) => ROut2,
  ) {
    super();
  }
}