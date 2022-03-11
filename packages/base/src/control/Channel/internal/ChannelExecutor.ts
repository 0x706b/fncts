import type { List } from "../../../collection/immutable/List";
import type { Cause } from "../../../data/Cause";
import type { Maybe } from "../../../data/Maybe";
import type { URIO } from "../../IO";
import type { ChildExecutorDecision } from "../ChildExecutorDecision/definition";
import type { BracketOut, Continuation, Ensuring } from "../definition";
import type { ChannelState } from "./ChannelState";
import type { UpstreamPullStrategy } from "./UpstreamPullStrategy";

import { Nil } from "../../../collection/immutable/List";
import { Queue } from "../../../collection/immutable/Queue";
import { ListBuffer } from "../../../collection/mutable/ListBuffer";
import { Exit } from "../../../data/Exit";
import { identity } from "../../../data/function";
import { Stack } from "../../../internal/Stack";
import { IO } from "../../IO";
import {
  Channel,
  ChannelTag,
  concrete,
  concreteContinuation,
  ContinuationFinalizer,
} from "../definition";
import { UpstreamPullRequest } from "../UpstreamPullRequest/definition";
import * as State from "./ChannelState";

type ErasedChannel<R> = Channel<R, unknown, unknown, unknown, unknown, unknown, unknown>;
export type ErasedExecutor<R> = ChannelExecutor<
  R,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>;
type ErasedContinuation<R> = Continuation<
  R,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>;

type Finalizer<R> = (exit: Exit<unknown, unknown>) => URIO<R, unknown>;

/*
 * -------------------------------------------------------------------------------------------------
 * SubexecutorStack
 * -------------------------------------------------------------------------------------------------
 */

type Subexecutor<R> = PullFromUpstream<R> | PullFromChild<R> | DrainChildExecutors<R> | Emit<R>;

const enum SubexecutorStackTag {
  PullFromUpstream = "PullFromUpstream",
  PullFromChild = "PullFromChild",
  DrainChildExecutors = "DrainChildExecutors",
  Emit = "Emit",
}

class PullFromUpstream<R> {
  readonly _tag = SubexecutorStackTag.PullFromUpstream;
  constructor(
    readonly upstreamExecutor: ErasedExecutor<R>,
    readonly createChild: (_: unknown) => ErasedChannel<R>,
    readonly lastDone: unknown,
    readonly activeChildExecutors: Queue<PullFromChild<R> | null>,
    readonly combineChildResults: (x: unknown, y: unknown) => unknown,
    readonly combineWithChildResult: (x: unknown, y: unknown) => unknown,
    readonly onPull: (_: UpstreamPullRequest<unknown>) => UpstreamPullStrategy<unknown>,
    readonly onEmit: (_: unknown) => ChildExecutorDecision,
  ) {}
  close(ex: Exit<unknown, unknown>): URIO<R, unknown> | null {
    const fin1 = this.upstreamExecutor.close(ex);
    const fins = this.activeChildExecutors
      .map((child) => (child !== null ? child.childExecutor.close(ex) : null))
      .enqueue(fin1);

    const finalizer = fins.foldLeft(
      null as URIO<R, Exit<never, any>> | null,
      (acc, next): URIO<R, Exit<never, any>> | null => {
        if (acc === null) {
          if (next === null) {
            return null;
          } else {
            return next.result;
          }
        } else {
          if (next === null) {
            return acc;
          } else {
            return acc.zipWith(next.result, (a, b) => a.apSecond(b));
          }
        }
      },
    );
    if (finalizer) {
      return finalizer.chain(IO.fromExitNow);
    } else {
      return null;
    }
  }

  enqueuePullFromChild(child: PullFromChild<R>): Subexecutor<R> {
    return new PullFromUpstream(
      this.upstreamExecutor,
      this.createChild,
      this.lastDone,
      this.activeChildExecutors.enqueue(child),
      this.combineChildResults,
      this.combineWithChildResult,
      this.onPull,
      this.onEmit,
    );
  }
}

class PullFromChild<R> {
  readonly _tag = SubexecutorStackTag.PullFromChild;
  constructor(
    readonly childExecutor: ErasedExecutor<R>,
    readonly parentSubexecutor: Subexecutor<R>,
    readonly onEmit: (_: unknown) => ChildExecutorDecision,
  ) {}

  close(ex: Exit<unknown, unknown>): URIO<R, unknown> | null {
    const fin1 = this.childExecutor.close(ex);
    const fin2 = this.parentSubexecutor.close(ex);
    if (fin1 === null) {
      if (fin2 === null) {
        return null;
      } else {
        return fin2;
      }
    } else {
      if (fin2 === null) {
        return fin1;
      } else {
        return fin1.result.zipWith(fin2.result, (a, b) => a.apSecond(b)).chain(IO.fromExitNow);
      }
    }
  }

  enqueuePullFromChild(_child: PullFromChild<R>): Subexecutor<R> {
    return this;
  }
}

class DrainChildExecutors<R> {
  readonly _tag = SubexecutorStackTag.DrainChildExecutors;
  constructor(
    readonly upstreamExecutor: ErasedExecutor<R>,
    readonly lastDone: any,
    readonly activeChildExecutors: Queue<PullFromChild<R> | null>,
    readonly upstreamDone: Exit<unknown, unknown>,
    readonly combineChildResults: (x: unknown, y: unknown) => unknown,
    readonly combineWithChildResult: (x: unknown, y: unknown) => unknown,
    readonly onPull: (_: UpstreamPullRequest<unknown>) => UpstreamPullStrategy<unknown>,
  ) {}

  close(ex: Exit<unknown, unknown>): URIO<R, Exit<unknown, unknown>> | null {
    const fin1 = this.upstreamExecutor.close(ex);
    const fins = this.activeChildExecutors
      .map((child) => (child !== null ? child.childExecutor.close(ex) : null))
      .enqueue(fin1);
    return pipe(
      fins.foldLeft(
        null as URIO<R, Exit<unknown, unknown>> | null,
        (acc, next): URIO<R, Exit<unknown, unknown>> | null => {
          if (acc === null) {
            if (next === null) {
              return null;
            } else {
              return next.result;
            }
          } else {
            if (next === null) {
              return acc;
            } else {
              return acc.zipWith(next.result, (a, b) => a.apSecond(b));
            }
          }
        },
      ),
    );
  }

  enqueuePullFromChild(child: PullFromChild<R>): Subexecutor<R> {
    return new DrainChildExecutors(
      this.upstreamExecutor,
      this.lastDone,
      this.activeChildExecutors.enqueue(child),
      this.upstreamDone,
      this.combineChildResults,
      this.combineWithChildResult,
      this.onPull,
    );
  }
}

class Emit<R> {
  readonly _tag = SubexecutorStackTag.Emit;
  constructor(readonly value: unknown, readonly next: Subexecutor<R> | null) {}
  close(ex: Exit<unknown, unknown>): URIO<R, unknown> | null {
    return this.next !== null ? this.next.close(ex) : null;
  }

  enqueuePullFromChild(_child: PullFromChild<R>): Subexecutor<R> {
    return this;
  }
}

/*
 * -------------------------------------------------------------------------------------------------
 * ChannelExecutor
 * -------------------------------------------------------------------------------------------------
 */
export function readUpstream<R, E, A>(r: State.Read<R, E>, cont: () => IO<R, E, A>): IO<R, E, A> {
  let readStack: Stack<State.Read<any, any>> | undefined = Stack.make(r);
  const read = (): IO<R, E, A> => {
    const current = readStack!.value;
    readStack     = readStack!.previous;
    if (current.upstream === null) {
      return IO.defer(cont);
    }
    const state = current.upstream.run();
    switch (state._tag) {
      case State.ChannelStateTag.Emit: {
        const emitEffect = current.onEmit(current.upstream.getEmit());
        if (readStack === undefined) {
          if (emitEffect === null) {
            return IO.defer(cont());
          } else {
            return emitEffect.chain(() => cont());
          }
        } else {
          if (emitEffect === null) {
            return IO.defer(read());
          } else {
            return emitEffect.chain(() => read());
          }
        }
      }
      case State.ChannelStateTag.Done: {
        const doneEffect = current.onDone(current.upstream.getDone());
        if (readStack === undefined) {
          if (doneEffect === null) {
            return IO.defer(cont());
          } else {
            return doneEffect.chain(() => cont());
          }
        } else {
          if (doneEffect === null) {
            return IO.defer(read());
          } else {
            return doneEffect.chain(() => read());
          }
        }
      }
      case State.ChannelStateTag.Effect: {
        readStack = Stack.make(current, readStack);
        return current
          .onEffect(state.io as IO<unknown, never, void>)
          .catchAllCause((cause) =>
            IO.defer(() => {
              const doneEffect = current.onDone(Exit.failCause(cause));
              return doneEffect === null ? IO.unit : doneEffect;
            }),
          )
          .chain(() => read());
      }
      case State.ChannelStateTag.Read: {
        readStack = Stack.make(current, readStack);
        readStack = Stack.make(state, readStack);
        return IO.defer(read());
      }
    }
  };
  return read();
}

export class ChannelExecutor<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  private input: ErasedExecutor<Env> | null              = null;
  private inProgressFinalizer: URIO<Env, unknown> | null = null;
  private activeSubexecutor: Subexecutor<Env> | null     = null;
  private doneStack: List<ErasedContinuation<Env>>       = Nil();
  private done: Exit<unknown, unknown> | null            = null;
  private cancelled: Exit<OutErr, OutDone> | null        = null;
  private emitted: unknown | null;
  private currentChannel: ErasedChannel<Env> | null;
  private closeLastSubstream: URIO<Env, unknown> | null = null;

  constructor(
    initialChannel: () => Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
    private providedEnv: unknown | null,
    private executeCloseLastSubstream: (_: URIO<Env, unknown>) => URIO<Env, unknown>,
  ) {
    this.currentChannel = initialChannel() as ErasedChannel<Env>;
  }

  getDone() {
    return this.done as Exit<OutErr, OutDone>;
  }

  getEmit() {
    return this.emitted as OutElem;
  }

  cancelWith(exit: Exit<OutErr, OutDone>) {
    this.cancelled = exit;
  }

  run(): ChannelState<Env, OutErr> {
    let result: ChannelState<Env, unknown> | null = null;

    while (result === null) {
      if (this.cancelled !== null) {
        result = this.processCancellation();
      } else if (this.activeSubexecutor !== null) {
        result = this.runSubexecutor();
      } else {
        if (this.currentChannel === null) {
          return State._Done;
        } else {
          concrete(this.currentChannel);
          const currentChannel = this.currentChannel;

          switch (currentChannel._tag) {
            case ChannelTag.Bridge: {
              if (this.input !== null) {
                const inputExecutor = this.input;
                this.input          = null;
                const drainer: URIO<Env, unknown> = currentChannel.input.awaitRead.apSecond(
                  IO.defer(() => {
                    const state = inputExecutor.run();

                    switch (state._tag) {
                      case State.ChannelStateTag.Done: {
                        const done = inputExecutor.getDone();
                        return done.match(
                          (cause) => currentChannel.input.error(cause),
                          (value) => currentChannel.input.done(value),
                        );
                      }
                      case State.ChannelStateTag.Emit: {
                        return currentChannel.input
                          .emit(inputExecutor.getEmit())
                          .chain(() => drainer);
                      }
                      case State.ChannelStateTag.Effect: {
                        return state.effect.matchCauseIO(
                          (cause) => currentChannel.input.error(cause),
                          () => drainer,
                        );
                      }
                      case State.ChannelStateTag.Read: {
                        return readUpstream(state, () => drainer).catchAllCause((cause) =>
                          currentChannel.input.error(cause),
                        );
                      }
                    }
                  }),
                );
                result = new State.Effect(
                  drainer.fork.chain((fiber) =>
                    IO.succeed(() => {
                      this.addFinalizer((exit) =>
                        fiber.interrupt.apSecond(
                          IO.defer(() => {
                            const effect = this.restorePipe(exit, inputExecutor);
                            if (effect !== null) {
                              return effect;
                            } else {
                              return IO.unit;
                            }
                          }),
                        ),
                      );
                    }),
                  ),
                );
              }
              break;
            }
            case ChannelTag.PipeTo: {
              const previousInput = this.input;
              const leftExec      = new ChannelExecutor(currentChannel.left, this.providedEnv, (_) =>
                this.executeCloseLastSubstream(_),
              );
              leftExec.input = previousInput;
              this.input     = leftExec;
              this.addFinalizer((exit) => {
                const effect = this.restorePipe(exit, previousInput);
                if (effect !== null) {
                  return effect;
                } else {
                  return IO.unit;
                }
              });
              this.currentChannel = currentChannel.right();
              break;
            }
            case ChannelTag.Read: {
              const read = currentChannel;
              result     = new State.Read(
                this.input,
                identity,
                (out) => {
                  this.currentChannel = read.more(out);
                  return null;
                },
                (exit) => {
                  this.currentChannel = read.done.onExit(exit);
                  return null;
                },
              );
              break;
            }
            case ChannelTag.Done: {
              result = this.doneSucceed(currentChannel.terminal());
              break;
            }
            case ChannelTag.Halt: {
              result = this.doneHalt(currentChannel.cause());
              break;
            }
            case ChannelTag.FromIO: {
              const pio =
                this.providedEnv === null
                  ? currentChannel.io
                  : currentChannel.io.provideEnvironment(this.providedEnv as Env);
              result = new State.Effect(
                pio.matchCauseIO(
                  (cause) => {
                    const state = this.doneHalt(cause);
                    if (state !== null && state._tag === State.ChannelStateTag.Effect) {
                      return state.effect;
                    } else {
                      return IO.unit;
                    }
                  },
                  (z) => {
                    const state = this.doneSucceed(z);
                    if (state !== null && state._tag === State.ChannelStateTag.Effect) {
                      return state.effect;
                    } else {
                      return IO.unit;
                    }
                  },
                ),
              );
              break;
            }
            case ChannelTag.Defer: {
              this.currentChannel = currentChannel.effect();
              break;
            }
            case ChannelTag.Emit: {
              this.emitted = currentChannel.out();
              this.currentChannel =
                this.activeSubexecutor !== null ? null : Channel.endNow(undefined);
              result = State._Emit;
              break;
            }
            case ChannelTag.Ensuring: {
              this.runEnsuring(currentChannel);
              break;
            }
            case ChannelTag.ConcatAll: {
              const innerExecuteLastClose = (f: URIO<Env, any>) =>
                IO.succeed(() => {
                  const prevLastClose =
                    this.closeLastSubstream === null ? IO.unit : this.closeLastSubstream;
                  this.closeLastSubstream = prevLastClose.chain(() => f);
                });
              const exec = new ChannelExecutor(
                () => currentChannel.value,
                this.providedEnv,
                innerExecuteLastClose,
              );
              exec.input             = this.input;
              this.activeSubexecutor = new PullFromUpstream(
                exec,
                currentChannel.k,
                null,
                Queue.empty(),
                currentChannel.combineInners,
                currentChannel.combineAll,
                currentChannel.onPull,
                currentChannel.onEmit,
              );
              this.closeLastSubstream = null;
              this.currentChannel     = null;
              break;
            }
            case ChannelTag.Fold: {
              this.doneStack      = this.doneStack.prepend(currentChannel.k);
              this.currentChannel = currentChannel.value;
              break;
            }
            case ChannelTag.BracketOut: {
              result = this.runBracketOut(currentChannel);
              break;
            }
            case ChannelTag.Provide: {
              const previousEnv   = this.providedEnv;
              this.providedEnv    = currentChannel.environment;
              this.currentChannel = currentChannel.inner;
              this.addFinalizer(() =>
                IO.succeed(() => {
                  this.providedEnv = previousEnv;
                }),
              );
              break;
            }
          }
        }
      }
    }
    return result as ChannelState<Env, OutErr>;
  }

  private restorePipe(
    exit: Exit<unknown, unknown>,
    prev: ErasedExecutor<Env> | null,
  ): IO<Env, never, unknown> | null {
    const currInput = this.input;
    this.input      = prev;
    return currInput !== null ? currInput.close(exit) : IO.unit;
  }

  private popAllFinalizers(exit: Exit<unknown, unknown>): URIO<Env, any> {
    /**
     * @tsplus tailrec
     */
    const unwind = (
      acc: IO<Env, never, Exit<never, any>>,
      conts: List<ErasedContinuation<Env>>,
    ): IO<Env, never, Exit<never, unknown>> => {
      if (conts.isEmpty()) {
        return acc;
      } else {
        const head = conts.unsafeHead!;
        concreteContinuation(head);
        if (head._tag === ChannelTag.ContinuationK) {
          return unwind(acc, conts.unsafeTail);
        } else {
          return unwind(acc.apSecond(head.finalizer(exit).result), conts.unsafeTail);
        }
      }
    };
    const effect = unwind(IO.succeedNow(Exit.succeed(undefined)), this.doneStack).chain(
      IO.fromExitNow,
    );
    this.doneStack = Nil();
    this.storeInProgressFinalizer(effect);
    return effect;
  }

  private popNextFinalizers(): List<ContinuationFinalizer<Env, unknown, unknown>> {
    const builder = new ListBuffer<ContinuationFinalizer<Env, unknown, unknown>>();
    /**
     * @tsplus tailrec
     */
    const go = (stack: List<ErasedContinuation<Env>>): List<ErasedContinuation<Env>> => {
      if (stack.isEmpty()) {
        return Nil();
      } else {
        const head = stack.unsafeHead;
        concreteContinuation(head);
        if (head._tag === ChannelTag.ContinuationK) {
          return stack;
        } else {
          builder.append(head);
          return go(stack.unsafeTail);
        }
      }
    };
    this.doneStack = go(this.doneStack);
    return builder.toList;
  }

  private storeInProgressFinalizer(finalizer: URIO<Env, unknown> | null): void {
    this.inProgressFinalizer = finalizer;
  }

  private clearInProgressFinalizer(): void {
    this.inProgressFinalizer = null;
  }

  private ifNotNull<R>(io: URIO<R, any> | null): IO<R, never, any> {
    return io !== null ? io : IO.unit;
  }

  close(exit: Exit<unknown, unknown>): IO<Env, never, unknown> | null {
    const runInProgressFinalizers =
      this.inProgressFinalizer !== null
        ? this.inProgressFinalizer.ensuring(IO.succeed(this.clearInProgressFinalizer()))
        : null;

    const closeSubexecutors: URIO<Env, unknown> | null =
      this.activeSubexecutor === null ? null : this.activeSubexecutor.close(exit);

    let closeSelf: URIO<Env, unknown> | null = null;

    const selfFinalizers = this.popAllFinalizers(exit);

    if (selfFinalizers !== null) {
      closeSelf = selfFinalizers.ensuring(IO.succeed(this.clearInProgressFinalizer()));
    }

    if (closeSubexecutors === null && runInProgressFinalizers === null && closeSelf === null) {
      return null;
    } else {
      return pipe(
        IO.sequenceT(
          this.ifNotNull(closeSubexecutors).result,
          this.ifNotNull(runInProgressFinalizers).result,
          this.ifNotNull(closeSelf).result,
        )
          .map(([a, b, c]) => a.apSecond(b).apSecond(c))
          .uninterruptible.chain(IO.fromExitNow),
      );
    }
  }

  private processCancellation(): ChannelState<Env, unknown> {
    this.currentChannel = null;
    this.done           = this.cancelled;
    this.cancelled      = null;
    return State._Done;
  }

  private finishSubexecutorWithCloseEffect(
    subexecDone: Exit<unknown, unknown>,
    ...closeFns: ReadonlyArray<(exit: Exit<unknown, unknown>) => URIO<Env, unknown> | null>
  ): ChannelState<Env, unknown> | null {
    this.addFinalizer(() =>
      IO.foreachDiscard(closeFns, (closeFn) =>
        pipe(
          IO.succeed(closeFn(subexecDone)).chain((closeEffect) => {
            if (closeEffect !== null) {
              return closeEffect;
            } else {
              return IO.unit;
            }
          }),
        ),
      ),
    );
    const state = subexecDone.match(
      (e) => this.doneHalt(e),
      (a) => this.doneSucceed(a),
    );
    this.activeSubexecutor = null;
    return state;
  }

  private runFinalizers(
    finalizers: List<(e: Exit<unknown, unknown>) => URIO<Env, unknown>>,
    exit: Exit<unknown, unknown>,
  ): URIO<Env, unknown> {
    if (finalizers.isEmpty()) {
      return IO.unit;
    }
    return pipe(
      IO.foreach(finalizers, (cont) => cont(exit).result)
        .map((results) => Exit.collectAll(results).getOrElse(Exit.unit as Exit<never, unknown>))
        .chain(IO.fromExitNow),
    );
  }

  private runSubexecutor(): ChannelState<Env, unknown> | null {
    switch (this.activeSubexecutor!._tag) {
      case SubexecutorStackTag.PullFromUpstream: {
        return this.pullFromUpstream(this.activeSubexecutor as PullFromUpstream<Env>);
      }
      case SubexecutorStackTag.DrainChildExecutors: {
        return this.drainChildExecutors(this.activeSubexecutor as DrainChildExecutors<Env>);
      }
      case SubexecutorStackTag.PullFromChild: {
        return this.pullFromChild(
          (this.activeSubexecutor as PullFromChild<Env>).childExecutor,
          (this.activeSubexecutor as PullFromChild<Env>).parentSubexecutor,
          (this.activeSubexecutor as PullFromChild<Env>).onEmit,
          this.activeSubexecutor as PullFromChild<Env>,
        );
      }
      case SubexecutorStackTag.Emit: {
        this.emitted           = (this.activeSubexecutor as Emit<Env>).value;
        this.activeSubexecutor = (this.activeSubexecutor as Emit<Env>).next;
        return new State.Emit();
      }
    }
  }

  private replaceSubexecutor(nextSubExec: Subexecutor<Env>): void {
    this.currentChannel    = null;
    this.activeSubexecutor = nextSubExec;
  }

  private applyUpstreamPullStrategy(
    upstreamFinished: boolean,
    queue: Queue<PullFromChild<Env> | null>,
    strategy: UpstreamPullStrategy<any>,
  ): readonly [Maybe<any>, Queue<PullFromChild<Env> | null>] {
    switch (strategy._tag) {
      case "PullAfterNext": {
        return [
          strategy.emitSeparator,
          !upstreamFinished || queue.exists((_) => _ !== null) ? queue.prepend(null) : queue,
        ];
      }
      case "PullAfterAllEnqueued": {
        return [
          strategy.emitSeparator,
          !upstreamFinished || queue.exists((_) => _ !== null) ? queue.enqueue(null) : queue,
        ];
      }
    }
  }

  private pullFromUpstream(subexec: PullFromUpstream<Env>): ChannelState<Env, any> | null {
    return pipe(
      subexec.activeChildExecutors.dequeue.match(
        () => this.performPullFromUpstream(subexec),
        ([activeChild, rest]) => {
          if (activeChild === null) {
            return this.performPullFromUpstream(
              new PullFromUpstream(
                subexec.upstreamExecutor,
                subexec.createChild,
                subexec.lastDone,
                rest,
                subexec.combineChildResults,
                subexec.combineWithChildResult,
                subexec.onPull,
                subexec.onEmit,
              ),
            );
          } else {
            this.replaceSubexecutor(
              new PullFromChild(
                activeChild.childExecutor,
                new PullFromUpstream(
                  subexec.upstreamExecutor,
                  subexec.createChild,
                  subexec.lastDone,
                  rest,
                  subexec.combineChildResults,
                  subexec.combineWithChildResult,
                  subexec.onPull,
                  subexec.onEmit,
                ),
                activeChild.onEmit,
              ),
            );
            return null;
          }
        },
      ),
    );
  }

  private performPullFromUpstream(subexec: PullFromUpstream<Env>): ChannelState<Env, any> {
    return new State.Read(
      subexec.upstreamExecutor,
      (effect) => {
        const closeLast         = this.closeLastSubstream === null ? IO.unit : this.closeLastSubstream;
        this.closeLastSubstream = null;
        return this.executeCloseLastSubstream(closeLast).apSecond(effect);
      },
      (emitted) => {
        if (this.closeLastSubstream !== null) {
          const closeLast         = this.closeLastSubstream;
          this.closeLastSubstream = null;
          return pipe(
            this.executeCloseLastSubstream(closeLast).map(() => {
              const childExecutor = new ChannelExecutor(
                () => subexec.createChild(emitted),
                this.providedEnv,
                (_) => this.executeCloseLastSubstream(_),
              );
              childExecutor.input = this.input;
              const [emitSeparator, updatedChildExecutors] = this.applyUpstreamPullStrategy(
                false,
                subexec.activeChildExecutors,
                subexec.onPull(UpstreamPullRequest.Pulled(emitted)),
              );
              this.activeSubexecutor = new PullFromChild(
                childExecutor,
                new PullFromUpstream(
                  subexec.upstreamExecutor,
                  subexec.createChild,
                  subexec.lastDone,
                  updatedChildExecutors,
                  subexec.combineChildResults,
                  subexec.combineWithChildResult,
                  subexec.onPull,
                  subexec.onEmit,
                ),
                subexec.onEmit,
              );
              if (emitSeparator.isJust()) {
                this.activeSubexecutor = new Emit(emitSeparator.value, this.activeSubexecutor);
              }
            }),
          );
        } else {
          const childExecutor = new ChannelExecutor(
            () => subexec.createChild(emitted),
            this.providedEnv,
            (_) => this.executeCloseLastSubstream(_),
          );
          childExecutor.input = this.input;

          const [emitSeparator, updatedChildExecutors] = this.applyUpstreamPullStrategy(
            false,
            subexec.activeChildExecutors,
            subexec.onPull(UpstreamPullRequest.Pulled(emitted)),
          );

          this.activeSubexecutor = new PullFromChild(
            childExecutor,
            new PullFromUpstream(
              subexec.upstreamExecutor,
              subexec.createChild,
              subexec.lastDone,
              updatedChildExecutors,
              subexec.combineChildResults,
              subexec.combineWithChildResult,
              subexec.onPull,
              subexec.onEmit,
            ),
            subexec.onEmit,
          );

          if (emitSeparator.isJust()) {
            this.activeSubexecutor = new Emit(emitSeparator.value, this.activeSubexecutor);
          }
          return null;
        }
      },
      (exit) => {
        if (subexec.activeChildExecutors.exists((_) => _ !== null)) {
          const drain = new DrainChildExecutors(
            subexec.upstreamExecutor,
            subexec.lastDone,
            subexec.activeChildExecutors.enqueue(null),
            subexec.upstreamExecutor.getDone(),
            subexec.combineChildResults,
            subexec.combineWithChildResult,
            subexec.onPull,
          );

          if (this.closeLastSubstream !== null) {
            const closeLast         = this.closeLastSubstream;
            this.closeLastSubstream = null;
            return pipe(
              this.executeCloseLastSubstream(closeLast).map(() => {
                this.replaceSubexecutor(drain);
              }),
            );
          } else {
            this.replaceSubexecutor(drain);
            return null;
          }
        } else {
          const lastClose = this.closeLastSubstream;
          return State.effectOrNullIgnored(
            this.finishSubexecutorWithCloseEffect(
              exit.map((_) => subexec.combineWithChildResult(subexec.lastDone, _)),
              () => lastClose,
              (exit) => subexec.upstreamExecutor.close(exit),
            ),
          );
        }
      },
    );
  }

  private drainChildExecutors(subexec: DrainChildExecutors<Env>): ChannelState<Env, any> | null {
    return pipe(
      subexec.activeChildExecutors.dequeue.match(
        () => {
          const lastClose = this.closeLastSubstream;
          if (lastClose !== null) {
            this.addFinalizer((_) => lastClose);
          }
          return this.finishSubexecutorWithCloseEffect(
            subexec.upstreamDone,
            () => lastClose,
            (_) => subexec.upstreamExecutor.close(_),
          );
        },
        ([activeChild, rest]) => {
          if (activeChild === null) {
            const [emitSeparator, remainingExecutors] = this.applyUpstreamPullStrategy(
              true,
              rest,
              subexec.onPull(UpstreamPullRequest.NoUpstream(rest.count((_) => _ !== null))),
            );
            this.replaceSubexecutor(
              new DrainChildExecutors(
                subexec.upstreamExecutor,
                subexec.lastDone,
                remainingExecutors,
                subexec.upstreamExecutor.getDone(),
                subexec.combineChildResults,
                subexec.combineWithChildResult,
                subexec.onPull,
              ),
            );
            return pipe(
              emitSeparator.match(
                () => null,
                (value) => {
                  this.emitted = value;
                  return new State.Emit();
                },
              ),
            );
          } else {
            this.replaceSubexecutor(
              new PullFromChild(
                activeChild.childExecutor,
                new DrainChildExecutors(
                  subexec.upstreamExecutor,
                  subexec.lastDone,
                  rest,
                  subexec.upstreamExecutor.getDone(),
                  subexec.combineChildResults,
                  subexec.combineWithChildResult,
                  subexec.onPull,
                ),
                activeChild.onEmit,
              ),
            );
            return null;
          }
        },
      ),
    );
  }

  private pullFromChild(
    childExecutor: ErasedExecutor<Env>,
    parentSubexecutor: Subexecutor<Env>,
    onEmitted: (_: any) => ChildExecutorDecision,
    subexec: PullFromChild<Env>,
  ): ChannelState<Env, any> | null {
    const handleSubexecFailure = (cause: Cause<any>): ChannelState<Env, any> | null => {
      return this.finishSubexecutorWithCloseEffect(
        Exit.failCause(cause),
        (_) => parentSubexecutor.close(_),
        (_) => childExecutor.close(_),
      );
    };

    const finishWithDoneValue = (doneValue: any): void => {
      switch (parentSubexecutor._tag) {
        case SubexecutorStackTag.PullFromUpstream: {
          const modifiedParent = new PullFromUpstream(
            parentSubexecutor.upstreamExecutor,
            parentSubexecutor.createChild,
            parentSubexecutor.lastDone !== null
              ? parentSubexecutor.combineChildResults(parentSubexecutor.lastDone, doneValue)
              : doneValue,
            parentSubexecutor.activeChildExecutors,
            parentSubexecutor.combineChildResults,
            parentSubexecutor.combineWithChildResult,
            parentSubexecutor.onPull,
            parentSubexecutor.onEmit,
          );
          this.closeLastSubstream = childExecutor.close(Exit.succeed(doneValue));
          this.replaceSubexecutor(modifiedParent);
          break;
        }
        case SubexecutorStackTag.DrainChildExecutors: {
          const modifiedParent = new DrainChildExecutors(
            parentSubexecutor.upstreamExecutor,
            parentSubexecutor.lastDone !== null
              ? parentSubexecutor.combineChildResults(parentSubexecutor.lastDone, doneValue)
              : doneValue,
            parentSubexecutor.activeChildExecutors,
            parentSubexecutor.upstreamDone,
            parentSubexecutor.combineChildResults,
            parentSubexecutor.combineWithChildResult,
            parentSubexecutor.onPull,
          );
          this.closeLastSubstream = childExecutor.close(Exit.succeed(doneValue));
          this.replaceSubexecutor(modifiedParent);
          break;
        }
        default: {
          throw new Error("Bug: this should not get here");
        }
      }
    };

    return new State.Read(
      childExecutor,
      identity,
      (emitted) => {
        pipe(
          onEmitted(emitted).match(
            () => void 0,
            (doneValue) => finishWithDoneValue(doneValue),
            () => {
              const modifiedParent = parentSubexecutor.enqueuePullFromChild(subexec);
              this.replaceSubexecutor(modifiedParent);
            },
          ),
        );
        this.activeSubexecutor = new Emit(emitted, this.activeSubexecutor);
        return null;
      },
      (exit) =>
        exit.match(
          (cause) => State.effectOrNullIgnored(handleSubexecFailure(cause)),
          (doneValue) => {
            finishWithDoneValue(doneValue);
            return null;
          },
        ),
    );
  }

  private doneSucceed(z: unknown): ChannelState<Env, unknown> | null {
    if (this.doneStack.isEmpty()) {
      this.done           = Exit.succeed(z);
      this.currentChannel = null;
      return State._Done;
    }
    const head = this.doneStack.unsafeHead;
    concreteContinuation(head);

    if (head._tag === ChannelTag.ContinuationK) {
      this.doneStack      = this.doneStack.unsafeTail;
      this.currentChannel = head.onSuccess(z);
      return null;
    } else {
      const finalizers = this.popNextFinalizers();

      if (this.doneStack.isEmpty()) {
        this.doneStack      = finalizers;
        this.done           = Exit.succeed(z);
        this.currentChannel = null;
        return State._Done;
      } else {
        const finalizerEffect = this.runFinalizers(
          finalizers.map((_) => _.finalizer),
          Exit.succeed(z),
        );
        this.storeInProgressFinalizer(finalizerEffect);
        return new State.Effect(
          pipe(
            finalizerEffect
              .ensuring(
                IO.succeed(() => {
                  this.clearInProgressFinalizer();
                }),
              )
              .uninterruptible.chain(() => IO.succeed(() => this.doneSucceed(z))),
          ),
        );
      }
    }
  }

  private doneHalt(cause: Cause<unknown>): ChannelState<Env, unknown> | null {
    if (this.doneStack.isEmpty()) {
      this.done           = Exit.failCause(cause);
      this.currentChannel = null;
      return State._Done;
    }
    const head = this.doneStack.unsafeHead!;
    concreteContinuation(head);

    if (head._tag === ChannelTag.ContinuationK) {
      this.doneStack      = this.doneStack.unsafeTail;
      this.currentChannel = head.onHalt(cause);
      return null;
    } else {
      const finalizers = this.popNextFinalizers();

      if (this.doneStack.isEmpty()) {
        this.doneStack      = finalizers;
        this.done           = Exit.failCause(cause);
        this.currentChannel = null;
        return State._Done;
      } else {
        const finalizerEffect = this.runFinalizers(
          finalizers.map((_) => _.finalizer),
          Exit.failCause(cause),
        );
        this.storeInProgressFinalizer(finalizerEffect);
        return new State.Effect(
          pipe(
            finalizerEffect
              .ensuring(
                IO.succeed(() => {
                  this.clearInProgressFinalizer();
                }),
              )
              .uninterruptible.chain(() => IO.succeed(() => this.doneHalt(cause))),
          ),
        );
      }
    }
  }

  private addFinalizer(f: Finalizer<Env>) {
    this.doneStack = this.doneStack.prepend(new ContinuationFinalizer(f));
  }

  private runBracketOut(
    bracketOut: BracketOut<Env, unknown, unknown, unknown>,
  ): ChannelState<Env, unknown> | null {
    return new State.Effect(
      IO.uninterruptibleMask(({ restore }) =>
        restore(bracketOut.acquire).matchCauseIO(
          (cause) =>
            IO.succeed(() => {
              this.currentChannel = Channel.failCause(cause);
            }),
          (out) =>
            IO.succeed(() => {
              this.addFinalizer((e) => bracketOut.finalizer(out, e));
              this.currentChannel = Channel.write(() => out);
            }),
        ),
      ),
    );
  }

  private runEnsuring(ensuring: Ensuring<Env, any, any, any, any, any, any>) {
    this.addFinalizer(ensuring.finalizer);
    this.currentChannel = ensuring.channel;
  }
}
