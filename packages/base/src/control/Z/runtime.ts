import { Conc } from "../../collection/immutable/Conc";
import { Cause } from "../../data/Cause";
import { Exit } from "../../data/Exit";
import { identity } from "../../data/function";
import { Stack } from "../../internal/Stack";
import { concrete, isZError, Z, ZTag } from "./definition";

class MatchFrame {
  readonly _zTag = "MatchFrame";
  constructor(
    readonly failure: (e: any) => Z<any, any, any, any, any, any>,
    readonly apply: (a: any) => Z<any, any, any, any, any, any>,
  ) {}
}

class ApplyFrame {
  readonly _zTag = "ApplyFrame";
  constructor(readonly apply: (e: any) => Z<any, any, any, any, any, any>) {}
}

type Frame = MatchFrame | ApplyFrame;

/**
 * Runs this computation with the specified initial state, returning either a
 * failure or the updated state and the result
 *
 * @tsplus fluent fncts.control.Z unsafeRunAll
 */
export function unsafeRunAll_<W, S1, S2, E, A>(
  ma: Z<W, S1, S2, unknown, E, A>,
  s: S1,
): readonly [Conc<W>, Exit<E, readonly [S2, A]>] {
  let stack: Stack<Frame> | undefined = undefined;
  let s0          = s as any;
  let result: any = null;
  let environment = undefined as Stack<any> | undefined;
  let failed      = false;
  let current     = ma as Z<any, any, any, any, any, any> | undefined;
  let log         = Conc.empty<W>();

  function unsafePopStackFrame() {
    const current = stack?.value;
    stack         = stack?.previous;
    return current;
  }

  function unsafePushStackFrame(cont: Frame) {
    stack = Stack.make(cont, stack);
  }

  function unsafePopEnv() {
    const current = environment?.value;
    environment   = environment?.previous;
    return current;
  }

  function unsafePushEnv(env: any) {
    environment = Stack.make(env, environment);
  }

  function unsafeUnwindStack() {
    let unwinding = true;
    while (unwinding) {
      const next = unsafePopStackFrame();

      if (next == null) {
        unwinding = false;
      } else {
        if (next._zTag === "MatchFrame") {
          unwinding = false;
          unsafePushStackFrame(new ApplyFrame(next.failure));
        }
      }
    }
  }

  while (current != null) {
    try {
      while (current != null) {
        const currZ: Z<any, any, any, any, any, any> = current;
        concrete(currZ);

        switch (currZ._tag) {
          case ZTag.Chain: {
            const nested       = currZ.ma;
            const continuation = currZ.f;
            concrete(nested);
            switch (nested._tag) {
              case ZTag.SucceedNow: {
                current = continuation(nested.value);
                break;
              }
              case ZTag.Succeed: {
                current = continuation(nested.effect());
                break;
              }
              case ZTag.Modify: {
                const updated = nested.run(s0);
                result        = updated[0];
                s0            = updated[1];
                current       = continuation(result);
                break;
              }
              default: {
                current = nested;
                unsafePushStackFrame(new ApplyFrame(continuation));
                break;
              }
            }
            break;
          }
          case ZTag.Succeed: {
            result                = currZ.effect();
            const nextInstruction = unsafePopStackFrame();
            if (nextInstruction) {
              current = nextInstruction.apply(result);
            } else {
              current = undefined;
            }
            break;
          }
          case ZTag.Defer: {
            current = currZ.make();
            break;
          }
          case ZTag.SucceedNow: {
            result          = currZ.value;
            const nextInstr = unsafePopStackFrame();
            if (nextInstr) {
              current = nextInstr.apply(result);
            } else {
              current = undefined;
            }
            break;
          }
          case ZTag.Fail: {
            unsafeUnwindStack();
            const nextInst = unsafePopStackFrame();
            if (nextInst) {
              current = nextInst.apply(currZ.cause);
            } else {
              failed  = true;
              result  = currZ.cause;
              current = undefined;
            }
            break;
          }
          case ZTag.Match: {
            current     = currZ.z;
            const state = s0;
            unsafePushStackFrame(
              new MatchFrame(
                (cause: Cause<any>) => {
                  const m = Z.put(state).chain(() => currZ.onFailure(log, cause));
                  log     = Conc.empty();
                  return m;
                },
                (a) => {
                  const m = currZ.onSuccess(log, a);
                  log     = Conc.empty();
                  return m;
                },
              ),
            );
            break;
          }
          case ZTag.Environment: {
            current = currZ.asks(environment?.value || {});
            break;
          }
          case ZTag.Provide: {
            unsafePushEnv(currZ.env);
            current = currZ.ma.match(
              (e) => Z.succeedNow(unsafePopEnv()).chain(() => Z.failNow(e)),
              (a) => Z.succeedNow(unsafePopEnv()).chain(() => Z.succeedNow(a)),
            );
            break;
          }
          case ZTag.Modify: {
            const updated  = currZ.run(s0);
            s0             = updated[1];
            result         = updated[0];
            const nextInst = unsafePopStackFrame();
            if (nextInst) {
              current = nextInst.apply(result);
            } else {
              current = undefined;
            }
            break;
          }
          case ZTag.Tell: {
            log            = currZ.log;
            const nextInst = unsafePopStackFrame();
            if (nextInst) {
              current = nextInst.apply(result);
            } else {
              current = undefined;
            }
            break;
          }
          case ZTag.MapLog: {
            current = currZ.ma;
            unsafePushStackFrame(
              new MatchFrame(
                (cause: Cause<any>) => {
                  log = currZ.modifyLog(log);
                  return Z.failCauseNow(cause);
                },
                (a) => {
                  log = currZ.modifyLog(log);
                  return Z.succeedNow(a);
                },
              ),
            );
          }
        }
      }
    } catch (e) {
      if (isZError(e)) {
        current = Z.failCauseNow(e.cause);
      } else {
        failed = true;
        result = Cause.halt(e);
      }
    }
  }

  if (failed) {
    return [log, Exit.failCause(result)];
  }

  return [log, Exit.succeed([s0, result])];
}

/**
 * Runs this computation with the specified initial state, returning both
 * the updated state and the result.
 *
 * @tsplus fluent fncts.control.Z unsafeRun
 */
export function unsafeRun_<W, S1, S2, A>(
  ma: Z<W, S1, S2, unknown, never, A>,
  s: S1,
): readonly [S2, A] {
  return ma.unsafeRunAll(s)[1].match((cause) => {
    // throw cause.squash
    throw new Error();
  }, identity);
}

/**
 * Runs this computation, returning the result.
 *
 * @tsplus getter fncts.control.Z unsafeRunResult
 */
export function unsafeRunResult<W, A>(ma: Z<W, unknown, unknown, unknown, never, A>): A {
  return unsafeRun_(ma, {})[1];
}

/**
 * Runs this computation with the given environment, returning the result.
 *
 * @tsplus fluent fncts.control.Z unsafeRunReader
 */
export function unsafeRunReader_<W, R, A>(ma: Z<W, unknown, never, R, never, A>, r: R): A {
  return unsafeRunResult(ma.provideEnvironment(r));
}

/**
 * Runs this computation with the specified initial state, returning the
 * updated state and discarding the result.
 *
 * @tsplus fluent fncts.control.Z unsafeRunState
 */
export function unsafeRunState_<W, S1, S2, A>(ma: Z<W, S1, S2, unknown, never, A>, s: S1): S2 {
  return ma.unsafeRun(s)[0];
}

/**
 * Runs this computation with the specified initial state, returning the
 * result and discarding the updated state.
 *
 * @tsplus fluent fncts.control.Z unsafeRunStateResult
 */
export function unsafeRunStateResult_<W, S1, S2, A>(ma: Z<W, S1, S2, unknown, never, A>, s: S1): A {
  return ma.unsafeRunAll(s)[1].match(
    (cause) => {
      // throw cause.squash
      throw new Error();
    },
    ([_, a]) => a,
  );
}

/**
 * Runs this computation returning either the result or error
 *
 * @tsplus getter fncts.control.Z unsafeRunExit
 */
export function unsafeRunExit<E, A>(ma: Z<never, unknown, unknown, unknown, E, A>): Exit<E, A> {
  return ma.unsafeRunAll({} as never)[1].map(([_, a]) => a);
}

/**
 *
 * @tsplus getter fncts.control.Z unsafeRunWriter
 */
export function unsafeRunWriter<W, A>(
  ma: Z<W, unknown, unknown, unknown, never, A>,
): readonly [Conc<W>, A] {
  const [w, exit] = ma.unsafeRunAll({});
  return exit.match(
    () => {
      // throw cause.squash
      throw new Error();
    },
    ([_, a]) => [w, a],
  );
}
