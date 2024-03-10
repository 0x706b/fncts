export const LayerVariance = Symbol.for("fncts.io.Layer.Variance");
export type LayerVariance = typeof LayerVariance;

export const LayerHash = Symbol.for("fncts.io.Layer.Hash");
export type LayerHash = typeof LayerHash;

/**
 * @tsplus type fncts.io.Layer
 * @tsplus companion fncts.io.LayerOps
 */
export abstract class Layer<RIn, E, ROut> {
  declare [LayerVariance]: {
    readonly _RIn: (_: never) => RIn;
    readonly _E: (_: never) => E;
    readonly _ROut: (_: never) => ROut;
  };

  [LayerHash]: PropertyKey = Symbol();

  setKey(hash: PropertyKey): this {
    this[LayerHash] = hash;
    return this;
  }
}

export type Concrete =
  | Fold<any, any, any, any, any, any, any, any, any>
  | Fresh<any, any, any>
  | FromScoped<any, any, any>
  | Defer<any, any, any>
  | To<any, any, any, any, any>
  | ZipWith<any, any, any, any, any, any, any>
  | ZipWithConcurrent<any, any, any, any, any, any, any>;

/**
 * @tsplus fluent fncts.io.Layer concrete
 */
export function concrete(self: Layer<any, any, any>): asserts self is Concrete {
  //
}

export const enum LayerTag {
  Fold,
  Fresh,
  Scoped,
  Defer,
  To,
  ZipWith,
  ZipWithConcurrent,
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
    readonly success: (r: Environment<ROut>) => Layer<RIn2, E2, ROut2>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class Fresh<RIn, E, ROut> extends Layer<RIn, E, ROut> {
  readonly _tag = LayerTag.Fresh;
  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class FromScoped<RIn, E, ROut> extends Layer<Exclude<RIn, Scope>, E, ROut> {
  readonly _tag = LayerTag.Scoped;
  constructor(
    readonly self: IO<RIn, E, Environment<ROut>>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class Defer<RIn, E, ROut> extends Layer<RIn, E, ROut> {
  readonly _tag = LayerTag.Defer;
  constructor(
    readonly self: () => Layer<RIn, E, ROut>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class To<RIn, E, ROut, E1, ROut1> extends Layer<RIn, E | E1, ROut1> {
  readonly _tag = LayerTag.To;
  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly that: Layer<ROut, E1, ROut1>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class ZipWith<RIn, E, ROut, RIn1, E1, ROut1, ROut2> extends Layer<RIn | RIn1, E | E1, ROut2> {
  readonly _tag = LayerTag.ZipWith;
  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly that: Layer<RIn1, E1, ROut1>,
    readonly f: (a: Environment<ROut>, b: Environment<ROut1>) => Environment<ROut2>,
    readonly trace?: string,
  ) {
    super();
  }
}

export class ZipWithConcurrent<RIn, E, ROut, RIn1, E1, ROut1, ROut2> extends Layer<RIn | RIn1, E | E1, ROut2> {
  readonly _tag = LayerTag.ZipWithConcurrent;
  constructor(
    readonly self: Layer<RIn, E, ROut>,
    readonly that: Layer<RIn1, E1, ROut1>,
    readonly f: (a: Environment<ROut>, b: Environment<ROut1>) => Environment<ROut2>,
    readonly trace?: string,
  ) {
    super();
  }
}
