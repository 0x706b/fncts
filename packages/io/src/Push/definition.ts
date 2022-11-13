/**
 * @tsplus type fncts.io.Push
 * @tsplus companion fncts.io.PushOps
 */
export class Push<R, E, A> {
  declare _R: (_: never) => R;
  declare _E: (_: never) => E;
  declare _A: (_: never) => A;
  constructor(readonly run: <R1>(emitter: Emitter<R1, E, A>) => IO<R | R1 | Scope, never, unknown>) {}
}

/**
 * @tsplus type fncts.io.Push.Emitter
 * @tsplus companion fncts.io.Push.EmitterOps
 */
export class Emitter<R, E, A> {
  constructor(
    readonly emit: (value: A) => IO<R, never, unknown>,
    readonly failCause: (cause: Cause<E>) => IO<R, never, void>,
    readonly end: IO<R, never, void>,
  ) {}
}

/**
 * @tsplus static fncts.io.PushOps __call
 */
export function makePush<R, E, A>(
  run: <R1>(emitter: Emitter<R1, E, A>) => IO<R | R1 | Scope, never, unknown>,
): Push<R, E, A> {
  return new Push(run);
}

/**
 * @tsplus static fncts.io.Push.EmitterOps __call
 */
export function makeEmitter<R, E, A>(
  emit: (value: A) => IO<R, never, unknown>,
  failCause: (cause: Cause<E>) => IO<R, never, unknown>,
  end: IO<R, never, unknown>,
): Emitter<R, E, A> {
  return new Emitter(emit, failCause, end);
}
