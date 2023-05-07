export const PushVariance = Symbol.for("fncts.io.Push.Variance");
export type PushVariance = typeof PushVariance;

export const PushTypeId = Symbol.for("fncts.io.Push");
export type PushTypeId = typeof PushTypeId;

/**
 * @tsplus type fncts.io.Push
 * @tsplus companion fncts.io.PushOps
 */
export class Push<R, E, A> {
  readonly [PushTypeId]: PushTypeId = PushTypeId;
  declare [PushVariance]: {
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
  constructor(readonly run: <R1>(emitter: Sink<R1, E, A>) => IO<R | R1, never, unknown>) {}
}

export declare namespace Push {
  export type EnvironmentOf<X> = [X] extends [{ [PushVariance]: { readonly _R: (_: never) => infer R } }] ? R : never;
  export type ErrorOf<X> = [X] extends [{ [PushVariance]: { readonly _E: (_: never) => infer E } }] ? E : never;
  export type ValueOf<X> = [X] extends [{ [PushVariance]: { readonly _A: (_: never) => infer A } }] ? A : never;
}

/**
 * @tsplus type fncts.io.Push.Sink
 * @tsplus companion fncts.io.Push.SinkOps
 */
export class Sink<R, E, A> {
  constructor(
    readonly event: (value: A) => IO<R, never, void>,
    readonly error: (cause: Cause<E>) => IO<R, never, void>,
  ) {}
}

/**
 * @tsplus static fncts.io.PushOps __call
 */
export function makePush<R, E, A>(run: <R1>(sink: Sink<R1, E, A>) => IO<R | R1, never, unknown>): Push<R, E, A> {
  return new Push(run);
}

/**
 * @tsplus static fncts.io.Push.SinkOps __call
 */
export function makeSink<R, E, A>(
  value: (value: A) => IO<R, never, unknown>,
  error: (cause: Cause<E>) => IO<R, never, unknown>,
): Sink<R, E, A> {
  return new Sink(value, error);
}
