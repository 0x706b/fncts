import { identity } from "../../data/function.js";
import { Stack } from "../../internal/Stack.js";
import { concrete, isZError, ZTag } from "./definition.js";

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
 * @tsplus pipeable fncts.control.Z unsafeRunAll
 */
export function unsafeRunAll<S1>(s: S1) {
  return <W, S2, E, A>(ma: Z<W, S1, S2, never, E, A>): readonly [Conc<W>, Exit<E, readonly [S2, A]>] => {
    const stack: Stack<Frame> = Stack();
    let s0                    = s as any;
    let result: any           = null;
    const environment         = Stack<Environment<unknown>>();
    let failed                = false;
    let current               = ma as Z<any, any, any, any, any, any> | undefined;
    let log                   = Conc.empty<W>();
    function unsafeUnwindStack() {
      let unwinding = true;
      while (unwinding) {
        const next = stack.pop();
        if (next == null) {
          unwinding = false;
        } else {
          if (next._zTag === "MatchFrame") {
            unwinding = false;
            stack.push(new ApplyFrame(next.failure));
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
                  stack.push(new ApplyFrame(continuation));
                  break;
                }
              }
              break;
            }
            case ZTag.Succeed: {
              result                = currZ.effect();
              const nextInstruction = stack.pop();
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
              const nextInstr = stack.pop();
              if (nextInstr) {
                current = nextInstr.apply(result);
              } else {
                current = undefined;
              }
              break;
            }
            case ZTag.Fail: {
              unsafeUnwindStack();
              const nextInst = stack.pop();
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
              stack.push(
                new MatchFrame(
                  (cause: Cause<any>) => {
                    const m = Z.put(state).flatMap(() => currZ.onFailure(log, cause));
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
            case ZTag.Access: {
              current = currZ.asks(environment.peek() ?? Environment());
              break;
            }
            case ZTag.Provide: {
              environment.push(currZ.env);
              current = currZ.ma.match(
                (e) => Z.succeedNow(environment.pop()).flatMap(() => Z.failNow(e)),
                (a) => Z.succeedNow(environment.pop()).flatMap(() => Z.succeedNow(a)),
              );
              break;
            }
            case ZTag.Modify: {
              const updated  = currZ.run(s0);
              s0             = updated[1];
              result         = updated[0];
              const nextInst = stack.pop();
              if (nextInst) {
                current = nextInst.apply(result);
              } else {
                current = undefined;
              }
              break;
            }
            case ZTag.Tell: {
              log            = currZ.log;
              const nextInst = stack.pop();
              if (nextInst) {
                current = nextInst.apply(result);
              } else {
                current = undefined;
              }
              break;
            }
            case ZTag.MapLog: {
              current = currZ.ma;
              stack.push(
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
  };
}

/**
 * Runs this computation with the specified initial state, returning both
 * the updated state and the result.
 *
 * @tsplus pipeable fncts.control.Z unsafeRun
 */
export function unsafeRun<S1>(s: S1) {
  return <W, S2, A>(ma: Z<W, S1, S2, never, never, A>): readonly [S2, A] => {
    return ma.unsafeRunAll(s)[1].match((cause) => {
      // throw cause.squash
      throw new Error();
    }, identity);
  };
}

/**
 * Runs this computation, returning the result.
 *
 * @tsplus getter fncts.control.Z unsafeRunResult
 */
export function unsafeRunResult<W, A>(ma: Z<W, unknown, unknown, never, never, A>): A {
  return ma.unsafeRun({})[1];
}

/**
 * Runs this computation with the given environment, returning the result.
 *
 * @tsplus pipeable fncts.control.Z unsafeRunReader
 */
export function unsafeRunReader<R>(r: Environment<R>) {
  return <W, A>(ma: Z<W, unknown, never, R, never, A>): A => {
    return unsafeRunResult(ma.provideEnvironment(r));
  };
}

/**
 * Runs this computation with the specified initial state, returning the
 * updated state and discarding the result.
 *
 * @tsplus pipeable fncts.control.Z unsafeRunState
 */
export function unsafeRunState<S1>(s: S1) {
  return <W, S2, A>(ma: Z<W, S1, S2, never, never, A>): S2 => {
    return ma.unsafeRun(s)[0];
  };
}

/**
 * Runs this computation with the specified initial state, returning the
 * result and discarding the updated state.
 *
 * @tsplus pipeable fncts.control.Z unsafeRunStateResult
 */
export function unsafeRunStateResult<S1>(s: S1) {
  return <W, S2, A>(ma: Z<W, S1, S2, never, never, A>): A => {
    return ma.unsafeRunAll(s)[1].match(
      (cause) => {
        // throw cause.squash
        throw new Error();
      },
      ([_, a]) => a,
    );
  };
}

/**
 * Runs this computation returning either the result or error
 *
 * @tsplus getter fncts.control.Z unsafeRunExit
 */
export function unsafeRunExit<E, A>(ma: Z<never, unknown, unknown, never, E, A>): Exit<E, A> {
  return ma.unsafeRunAll({} as never)[1].map(([_, a]) => a);
}

/**
 *
 * @tsplus getter fncts.control.Z unsafeRunWriter
 */
export function unsafeRunWriter<W, A>(ma: Z<W, unknown, unknown, never, never, A>): readonly [Conc<W>, A] {
  const [w, exit] = ma.unsafeRunAll({});
  return exit.match(
    () => {
      // throw cause.squash
      throw new Error();
    },
    ([_, a]) => [w, a],
  );
}
