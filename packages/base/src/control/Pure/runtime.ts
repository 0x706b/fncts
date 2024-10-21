import { identity } from "../../data/function.js";
import { Stack } from "../../internal/Stack.js";
import { concrete, isPureError, PurePrimitive, PureTag } from "./definition.js";

class MatchFrame {
  readonly _tag = "MatchFrame";
  constructor(
    readonly failure: (e: any) => Pure<any, any, any, any, any, any>,
    readonly apply: (a: any) => Pure<any, any, any, any, any, any>,
  ) {}
}

class ApplyFrame {
  readonly _tag = "ApplyFrame";
  constructor(readonly apply: (e: any) => Pure<any, any, any, any, any, any>) {}
}

type Frame = MatchFrame | ApplyFrame;

/**
 * Runs this computation with the specified initial state, returning either a
 * failure or the updated state and the result
 *
 * @tsplus pipeable fncts.control.Pure unsafeRunAll
 */
export function unsafeRunAll<S1>(s: S1) {
  return <W, S2, E, A>(ma: Pure<W, S1, S2, never, E, A>): readonly [Conc<W>, Exit<E, readonly [S2, A]>] => {
    const stack: Stack<Frame> = Stack();
    let s0                    = s as any;
    let result: any           = null;
    const environment         = Stack<Environment<unknown>>();
    let failed                = false;
    let current               = ma as Pure<any, any, any, any, any, any> | undefined;
    let log                   = Conc.empty<W>();
    function unsafeUnwindStack() {
      let unwinding = true;
      while (unwinding) {
        const next = stack.pop();
        if (next == null) {
          unwinding = false;
        } else {
          if (next._tag === "MatchFrame") {
            unwinding = false;
            stack.push(new ApplyFrame(next.failure));
          }
        }
      }
    }
    while (current != null) {
      try {
        while (current != null) {
          const currPure: Pure<any, any, any, any, any, any> = current;
          concrete(currPure);
          switch (currPure._tag) {
            case PureTag.Chain: {
              const nested       = currPure.i0;
              const continuation = currPure.i1;
              concrete(nested);
              switch (nested._tag) {
                case PureTag.SucceedNow: {
                  current = continuation(nested.i0);
                  break;
                }
                case PureTag.Succeed: {
                  current = continuation(nested.i0());
                  break;
                }
                case PureTag.Modify: {
                  const updated = nested.i0(s0);
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
            case PureTag.Succeed: {
              result                = currPure.i0();
              const nextInstruction = stack.pop();
              if (nextInstruction) {
                current = nextInstruction.apply(result);
              } else {
                current = undefined;
              }
              break;
            }
            case PureTag.Defer: {
              current = currPure.i0();
              break;
            }
            case PureTag.SucceedNow: {
              result          = currPure.i0;
              const nextInstr = stack.pop();
              if (nextInstr) {
                current = nextInstr.apply(result);
              } else {
                current = undefined;
              }
              break;
            }
            case PureTag.Fail: {
              unsafeUnwindStack();
              const nextInst = stack.pop();
              if (nextInst) {
                current = nextInst.apply(currPure.i0);
              } else {
                failed  = true;
                result  = currPure.i0;
                current = undefined;
              }
              break;
            }
            case PureTag.Match: {
              current     = currPure.i0;
              const state = s0;
              stack.push(
                new MatchFrame(
                  (cause: Cause<any>) => {
                    const m = Pure.put(state).flatMap(() => currPure.i1(log, cause));
                    log     = Conc.empty();
                    return m;
                  },
                  (a) => {
                    const m = currPure.i2(log, a);
                    log     = Conc.empty();
                    return m;
                  },
                ),
              );
              break;
            }
            case PureTag.Access: {
              current = currPure.i0(environment.peek() ?? Environment());
              break;
            }
            case PureTag.Provide: {
              environment.push(currPure.i1);
              current             = new PurePrimitive(PureTag.Match) as any;
              (current as any).i0 = currPure;
              (current as any).i1 = (e: any) => Pure.succeedNow(environment.pop()).flatMap(() => Pure.failNow(e));
              (current as any).i2 = (a: any) => Pure.succeedNow(environment.pop()).flatMap(() => Pure.succeedNow(a));
              break;
            }
            case PureTag.Modify: {
              const updated  = currPure.i0(s0);
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
            case PureTag.Tell: {
              log            = currPure.i0;
              const nextInst = stack.pop();
              if (nextInst) {
                current = nextInst.apply(result);
              } else {
                current = undefined;
              }
              break;
            }
            case PureTag.MapLog: {
              current = currPure.i0;
              stack.push(
                new MatchFrame(
                  (cause: Cause<any>) => {
                    log = currPure.i1(log);
                    return Pure.failCauseNow(cause);
                  },
                  (a) => {
                    log = currPure.i1(log);
                    return Pure.succeedNow(a);
                  },
                ),
              );
            }
          }
        }
      } catch (e) {
        if (isPureError(e)) {
          current = Pure.failCauseNow(e.cause);
        } else {
          current = Pure.failCauseNow(Cause.halt(e));
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
 * @tsplus pipeable fncts.control.Pure unsafeRun
 */
export function unsafeRun<S1>(s: S1) {
  return <W, S2, A>(ma: Pure<W, S1, S2, never, never, A>): readonly [S2, A] => {
    return ma.unsafeRunAll(s)[1].match((cause) => {
      throw cause.squashWith(Function.identity);
    }, identity);
  };
}

/**
 * Runs this computation, returning the result.
 *
 * @tsplus getter fncts.control.Pure unsafeRunResult
 */
export function unsafeRunResult<W, A>(ma: Pure<W, unknown, unknown, never, never, A>): A {
  return ma.unsafeRun({})[1];
}

/**
 * Runs this computation with the given environment, returning the result.
 *
 * @tsplus pipeable fncts.control.Pure unsafeRunReader
 */
export function unsafeRunReader<R>(r: Environment<R>) {
  return <W, A>(ma: Pure<W, unknown, never, R, never, A>): A => {
    return unsafeRunResult(ma.provideEnvironment(r));
  };
}

/**
 * Runs this computation with the specified initial state, returning the
 * updated state and discarding the result.
 *
 * @tsplus pipeable fncts.control.Pure unsafeRunState
 */
export function unsafeRunState<S1>(s: S1) {
  return <W, S2, A>(ma: Pure<W, S1, S2, never, never, A>): S2 => {
    return ma.unsafeRun(s)[0];
  };
}

/**
 * Runs this computation with the specified initial state, returning the
 * result and discarding the updated state.
 *
 * @tsplus pipeable fncts.control.Pure unsafeRunStateResult
 */
export function unsafeRunStateResult<S1>(s: S1) {
  return <W, S2, A>(ma: Pure<W, S1, S2, never, never, A>): A => {
    return ma.unsafeRunAll(s)[1].match(
      (cause) => {
        throw cause.squashWith(Function.identity);
      },
      ([_, a]) => a,
    );
  };
}

/**
 * Runs this computation returning either the result or error
 *
 * @tsplus getter fncts.control.Pure unsafeRunExit
 */
export function unsafeRunExit<E, A>(ma: Pure<never, unknown, unknown, never, E, A>): Exit<E, A> {
  return ma.unsafeRunAll({} as never)[1].map(([_, a]) => a);
}

/**
 *
 * @tsplus getter fncts.control.Pure unsafeRunWriter
 */
export function unsafeRunWriter<W, A>(ma: Pure<W, unknown, unknown, never, never, A>): readonly [Conc<W>, A] {
  const [w, exit] = ma.unsafeRunAll({});
  return exit.match(
    (cause) => {
      throw cause.squashWith(Function.identity);
    },
    ([_, a]) => [w, a],
  );
}
