import type { FiberStatus } from "../FiberStatus.js";
import type { OnFailure, OnSuccess, OnSuccessAndFailure, UIO } from "../IO/definition.js";
import type { RuntimeFlags } from "../RuntimeFlags.js";

import { Trace } from "@fncts/base/data/Trace";
import { FiberTypeId, FiberVariance } from "@fncts/io/Fiber/definition";
import { StackTraceBuilder } from "@fncts/io/internal/StackTraceBuilder";

import { Done, Suspended } from "../FiberStatus.js";
import { Running } from "../FiberStatus.js";
import { FiberStatusTag } from "../FiberStatus.js";
import { LinkedQueue } from "../internal/MutableQueue.js";
import { isIO } from "../IO/definition.js";
import { WhileLoop } from "../IO/definition.js";
import { IOOpCode } from "../IO/definition.js";
import { isIOError } from "../IO/definition.js";
import { RuntimeFlag } from "../RuntimeFlag.js";
import { FiberMessage, FiberMessageTag } from "./FiberMessage.js";

export class RevertFlags {
  readonly ioOpCode = IOOpCode.RevertFlags;
  constructor(readonly patch: RuntimeFlags.Patch, readonly trace?: string) {}
}

export class UpdateTrace {
  readonly ioOpCode = IOOpCode.UpdateTrace;
  constructor(readonly trace?: string) {}
}

export type Continuation =
  | OnSuccess<any, any, any, any, any, any>
  | OnSuccessAndFailure<any, any, any, any, any, any, any, any, any>
  | OnFailure<any, any, any, any, any, any>
  | WhileLoop<any, any, any>
  | UpdateTrace
  | RevertFlags;

/**
 * @tsplus type fncts.io.Fiber
 */
export class FiberRuntime<E, A> implements Fiber.Runtime<E, A> {
  readonly [FiberTypeId]: FiberTypeId = FiberTypeId;
  declare [FiberVariance]: {
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
  readonly _tag = "RuntimeFiber";

  constructor(readonly fiberId: FiberId.Runtime, fiberRefs0: FiberRefs, readonly runtimeFlags0: RuntimeFlags) {
    this._fiberRefs    = fiberRefs0;
    this._runtimeFlags = runtimeFlags0;
  }

  private _fiberRefs: FiberRefs;
  private _runtimeFlags: RuntimeFlags;
  private queue            = new LinkedQueue<FiberMessage>();
  private _children        = null! as Set<FiberRuntime<any, any>>;
  private observers        = List<(_: Exit<E, A>) => void>();
  private running          = false;
  private stack            = new Stack<Continuation>();
  private asyncInterruptor = null! as (_: IO<any, any, any>) => any;
  private asyncTrace       = null! as string;
  private asyncBlockinOn   = null! as FiberId;
  private _exitValue       = null! as Exit<E, A>;

  get id(): FiberId.Runtime {
    return this.fiberId;
  }

  ask<A>(f: (fiberRuntime: FiberRuntime<any, any>, status: FiberStatus) => A): UIO<A> {
    return IO.defer(() => {
      const future = Future.unsafeMake<never, A>(this.fiberId);

      this.tell(FiberMessage.Stateful((fiber, status) => future.unsafeDone(IO.succeed(f(fiber, status)))));

      return future.await;
    });
  }

  get await(): UIO<Exit<E, A>> {
    return IO.async<never, never, Exit<E, A>>(
      (cb) =>
        this.tell(
          FiberMessage.Stateful((fiber, _) => {
            if (fiber._exitValue !== null) cb(IO.succeedNow(fiber.exitValue()));
            else fiber.addObserver((exit) => cb(IO.succeedNow(exit)));
          }),
        ),
      this.id,
    );
  }

  get children(): UIO<Conc<FiberRuntime<any, any>>> {
    return this.ask((fiber) => Conc.from(fiber.getChildren()));
  }

  get fiberRefs(): UIO<FiberRefs> {
    return this.ask((fiber) => fiber.getFiberRefs());
  }

  get inheritAll(): UIO<void> {
    return IO.withFiberRuntime((parentFiber, parentStatus) => {
      const parentFiberId      = parentFiber.id;
      const parentFiberRefs    = parentFiber.getFiberRefs();
      const parentRuntimeFlags = parentStatus.runtimeFlags;

      const childFiberRefs   = this.getFiberRefs();
      const updatedFiberRefs = parentFiberRefs.join(parentFiberId, childFiberRefs);

      parentFiber.setFiberRefs(updatedFiberRefs);

      return this.runtimeFlags.flatMap((childRuntimeFlags) => {
        const patch = parentRuntimeFlags
          .diff(childRuntimeFlags)
          .exclude(RuntimeFlag.WindDown)
          .exclude(RuntimeFlag.Interruption);

        return IO.updateRuntimeFlags(patch);
      });
    });
  }

  get runtimeFlags(): UIO<RuntimeFlags> {
    return this.ask((state, status) => {
      if (status._tag === FiberStatusTag.Done) return state._runtimeFlags;
      else return status.runtimeFlags;
    });
  }

  interruptAsFork(fiberId: FiberId): UIO<void> {
    return IO.succeed(() => {
      const cause = Cause.interrupt(fiberId);
      this.tell(FiberMessage.InterruptSignal(cause));
    });
  }

  getSupervisor(): Supervisor<any> {
    return this.getFiberRef(FiberRef.currentSupervisor);
  }

  get poll(): UIO<Maybe<Exit<E, A>>> {
    return IO.succeed(Maybe.fromNullable(this.exitValue()));
  }

  private run(): void {
    this.drainQueueOnCurrentThread();
  }

  private drainQueueOnCurrentThread(): void {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    let recurse = true;

    while (recurse) {
      let evaluationSignal = EvaluationSignal.Continue;
      if (this._runtimeFlags.currentFiber) {
        // TODO
      }
      try {
        while (evaluationSignal === EvaluationSignal.Continue) {
          evaluationSignal = this.queue.isEmpty
            ? EvaluationSignal.Done
            : this.evaluateMessageWhileSuspended(this.queue.dequeue(null!));
        }
      } finally {
        this.running = false;
        if (this._runtimeFlags.currentFiber) {
          // TODO
        }
      }

      if (!this.queue.isEmpty && !this.running) {
        this.running = true;
        if (evaluationSignal === EvaluationSignal.YieldNow) {
          this.drainQueueLaterOnExecutor();
          recurse = false;
        } else {
          recurse = true;
        }
      } else {
        recurse = false;
      }
    }
  }

  private drainQueueLaterOnExecutor(): void {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    this.getFiberRef(FiberRef.currentScheduler).scheduleTask(() => this.run());
  }

  private drainQueueWhileRunning(
    runtimeFlags: RuntimeFlags,
    lastTrace: string,
    cur0: IO<any, any, any>,
  ): IO<any, any, any> {
    let cur = cur0;

    while (!this.queue.isEmpty) {
      const message = this.queue.dequeue(null!);

      switch (message._tag) {
        case FiberMessageTag.InterruptSignal: {
          this.processNewInterruptSignal(message.cause);
          cur = runtimeFlags.interruptible ? IO.failCause(message.cause) : cur;
          break;
        }
        case FiberMessageTag.GenStackTrace: {
          const oldCur = cur;
          cur          = IO.stackTrace(undefined).flatMap((stackTrace) => {
            message.onTrace(stackTrace);
            return oldCur;
          }, undefined);
          break;
        }
        case FiberMessageTag.Stateful: {
          message.onFiber(this, new Running(runtimeFlags, lastTrace));
          break;
        }
        case FiberMessageTag.Resume: {
          throw new IllegalStateError("It is illegal to have multiple concurrent run loops in a single fiber");
        }
        case FiberMessageTag.YieldNow: {
          const oldCur = cur;
          cur          = IO.yieldNow.flatMap(() => oldCur, undefined);
          break;
        }
      }
    }

    return cur;
  }

  private evaluateEffect(effect0: IO<any, any, any>) {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    this.getSupervisor().unsafeOnResume(this);

    try {
      let effect: IO<any, any, any>;

      if (this._runtimeFlags.interruptible && this.isInterrupted()) {
        effect = IO.failCause(this.getInterruptedCause());
      } else {
        effect = effect0;
      }

      let finalExit = null! as Exit<E, A>;

      while (effect !== null) {
        try {
          const exit         = this.runLoop(effect);
          this._runtimeFlags = this._runtimeFlags.enable(RuntimeFlag.WindDown);
          const interruption = this.interruptAllChildren();

          if (interruption === null) {
            if (this.queue.isEmpty) {
              finalExit = exit;
              this.setExitValue(exit);
            } else {
              this.tell(FiberMessage.Resume(IO.fromExitNow(exit)));
            }

            effect = null!;
          } else {
            effect = interruption.flatMap(() => IO.fromExitNow(exit), this.id.location);
          }
        } catch (e) {
          if (isIO(e)) {
            if (IO.concrete(e).ioOpCode === IOOpCode.YieldNow) {
              if (this._runtimeFlags.cooperativeYielding) {
                this.tell(FiberMessage.YieldNow);
                this.tell(FiberMessage.Resume(IO.unit));
                effect = null!;
              } else {
                effect = IO.unit;
              }
            } else if (IO.concrete(e).ioOpCode === IOOpCode.Async) {
              effect = null!;
            } else {
              throw new Error(`Unhandled op ${IO.concrete(e).ioOpCode}`);
            }
          } else {
            throw e;
          }
        }
      }
    } finally {
      this.getSupervisor().unsafeOnSuspend(this);
    }
  }

  runLoop(effect: IO<any, any, any>): Exit<any, any> {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    let cur       = IO.concrete(effect);
    let lastTrace = undefined! as string;
    let ops       = 0;

    while (true) {
      if (this._runtimeFlags.opSupervision) {
        this.getSupervisor().unsafeOnEffect(this, cur);
      }
      const nextTrace = IO.concrete(cur).trace;
      if (nextTrace !== undefined) lastTrace = nextTrace;

      cur = IO.concrete(this.drainQueueWhileRunning(this._runtimeFlags, lastTrace, cur));

      ops += 1;

      if (ops > 2048) {
        ops          = 0;
        const oldCur = cur;
        const trace  = lastTrace;
        cur          = IO.concrete(IO.yieldNow.flatMap(() => oldCur, trace));
      }
      try {
        switch (cur.ioOpCode) {
          case IOOpCode.Sync: {
            const value = cur.evaluate();
            const cont  = this.getNextSuccessCont();
            if (cont) {
              switch (cont.ioOpCode) {
                case IOOpCode.OnSuccess:
                case IOOpCode.OnSuccessAndFailure: {
                  cur = IO.concrete(cont.successK(value));
                  break;
                }
                case IOOpCode.WhileLoop: {
                  cont.process(value);
                  if (cont.check()) {
                    this.stack.push(cont);
                    cur = IO.concrete(cont.body());
                  } else {
                    cur = IO.concrete(IO.unit);
                  }
                  break;
                }
                case IOOpCode.RevertFlags: {
                  this.patchRuntimeFlags(this._runtimeFlags, cont.patch);
                  if (this._runtimeFlags.interruptible && this.isInterrupted()) {
                    cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
                  } else {
                    cur = IO.concrete(IO.succeedNow(value));
                  }
                  break;
                }
                case IOOpCode.UpdateTrace: {
                  if (cont.trace !== undefined) lastTrace = cont.trace;
                  cur = IO.concrete(IO.unit);
                  break;
                }
              }
            } else {
              return Exit.succeed(value);
            }
            break;
          }
          case IOOpCode.OnSuccessAndFailure:
          case IOOpCode.OnFailure:
          case IOOpCode.OnSuccess: {
            this.stack.push(cur);
            cur = IO.concrete(cur.first);
            break;
          }
          case IOOpCode.Async: {
            this.asyncTrace     = lastTrace;
            this.asyncBlockinOn = cur.blockingOn();
            this.initiateAsync(this._runtimeFlags, cur.registerCallback);
            throw cur;
          }
          case IOOpCode.UpdateRuntimeFlagsWithin: {
            const updateFlags     = cur.update;
            const oldRuntimeFlags = this._runtimeFlags;
            const newRuntimeFlags = updateFlags.patch(oldRuntimeFlags);

            if (newRuntimeFlags === oldRuntimeFlags) {
              cur = IO.concrete(cur.scope(oldRuntimeFlags));
            } else {
              if (newRuntimeFlags.interruptible && this.isInterrupted()) {
                cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
              } else {
                this.patchRuntimeFlags(this._runtimeFlags, updateFlags);
                const revertFlags = newRuntimeFlags.diff(oldRuntimeFlags);
                this.stack.push(new RevertFlags(revertFlags));
                cur = IO.concrete(cur.scope(oldRuntimeFlags));
              }
            }
            break;
          }
          case IOOpCode.GenerateStackTrace: {
            cur = IO.concrete(IO.succeedNow(this.generateStackTrace()));
            break;
          }
          case IOOpCode.Stateful: {
            cur = IO.concrete(cur.onState(this, new Running(this._runtimeFlags, lastTrace)));
            break;
          }
          case IOOpCode.SucceedNow: {
            const oldCur = cur;
            const cont   = this.getNextSuccessCont();
            if (cont) {
              switch (cont.ioOpCode) {
                case IOOpCode.OnSuccess:
                case IOOpCode.OnSuccessAndFailure: {
                  cur = IO.concrete(cont.successK(oldCur.value));
                  break;
                }
                case IOOpCode.WhileLoop: {
                  cont.process(oldCur.value);
                  if (cont.check()) {
                    this.stack.push(cont);
                    cur = IO.concrete(cont.body());
                  } else {
                    cur = IO.concrete(IO.unit);
                  }
                  break;
                }
                case IOOpCode.RevertFlags: {
                  this.patchRuntimeFlags(this._runtimeFlags, cont.patch);
                  if (this._runtimeFlags.interruptible && this.isInterrupted()) {
                    cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
                  }
                  break;
                }
                case IOOpCode.UpdateTrace: {
                  if (cont.trace !== undefined) lastTrace = cont.trace;
                  cur = IO.concrete(IO.unit);
                  break;
                }
              }
            } else {
              return Exit.succeed(oldCur.value);
            }
            break;
          }
          case IOOpCode.Fail: {
            const cause = cur.cause();
            const cont  = this.getNextFailCont();
            if (cont) {
              switch (cont.ioOpCode) {
                case IOOpCode.OnFailure:
                case IOOpCode.OnSuccessAndFailure: {
                  if (!(this._runtimeFlags.interruptible && this.isInterrupted())) {
                    cur = IO.concrete(cont.failureK(cause));
                  } else {
                    cur = IO.concrete(IO.failCauseNow(cause.stripFailures));
                  }
                  break;
                }
                case IOOpCode.RevertFlags: {
                  this.patchRuntimeFlags(this._runtimeFlags, cont.patch);
                  if (this._runtimeFlags.interruptible && this.isInterrupted()) {
                    const interruptedCause = this.getInterruptedCause();
                    if (cause.contains(interruptedCause)) {
                      cur = IO.concrete(IO.failCauseNow(cause));
                    } else {
                      cur = IO.concrete(IO.failCauseNow(Cause.then(cause, this.getInterruptedCause())));
                    }
                  }
                  break;
                }
                case IOOpCode.UpdateTrace: {
                  if (cont.trace !== undefined) lastTrace = cont.trace;
                  cur = IO.concrete(IO.unit);
                  break;
                }
              }
            } else {
              return Exit.failCause(cause);
            }
            break;
          }
          case IOOpCode.UpdateRuntimeFlags: {
            this.patchRuntimeFlags(this._runtimeFlags, cur.update);
            cur = IO.concrete(IO.unit);
            break;
          }
          case IOOpCode.WhileLoop: {
            const iterate = cur;
            const check   = iterate.check;
            const body    = iterate.body;
            if (check()) {
              cur = IO.concrete(body());
              this.stack.push(iterate);
            } else {
              cur = IO.concrete(IO.unit);
            }
            break;
          }
          case IOOpCode.YieldNow: {
            throw cur;
          }
          case IOOpCode.Commit: {
            cur = IO.concrete(cur.commit);
          }
        }
      } catch (e) {
        if (isIOError(e)) {
          cur = IO.concrete(IO.failCauseNow(e.cause));
        } else if (
          isIO(e) &&
          (IO.concrete(e).ioOpCode === IOOpCode.Async || IO.concrete(e).ioOpCode === IOOpCode.YieldNow)
        ) {
          throw e;
        } else if (isInterruptedException(e)) {
          cur = IO.concrete(IO.failCauseNow(Cause.both(Cause.halt(e), Cause.interrupt(FiberId.none))));
        } else {
          cur = IO.concrete(IO.failCauseNow(Cause.halt(e)));
        }
      }
    }
  }

  getInterruptedCause(): Cause<never> {
    return this.getFiberRef(FiberRef.interruptedCause);
  }

  isInterrupted(): boolean {
    return !this.getFiberRef(FiberRef.interruptedCause).isEmpty;
  }

  getFiberRef<A>(fiberRef: FiberRef<A>): A {
    return this._fiberRefs.getOrDefault(fiberRef);
  }

  tell(message: FiberMessage): void {
    this.queue.enqueue(message);
    if (!this.running) {
      this.running = true;
      this.drainQueueLaterOnExecutor();
    }
  }

  exitValue(): Exit<E, A> {
    return this._exitValue;
  }

  addObserver(observer: (exit: Exit<E, A>) => void): void {
    if (this._exitValue !== null) observer(this._exitValue);
    else this.observers = Cons(observer, this.observers);
  }

  getChildren(): Set<FiberRuntime<any, any>> {
    if (this._children === null) {
      this._children = new Set();
    }
    return this._children;
  }

  getFiberRefs(): FiberRefs {
    return this._fiberRefs;
  }

  setFiberRefs(fiberRefs0: FiberRefs): void {
    this._fiberRefs = fiberRefs0;
  }

  private patchRuntimeFlags(oldRuntimeFlags: RuntimeFlags, patch: RuntimeFlags.Patch): RuntimeFlags {
    const newRuntimeFlags = patch.patch(oldRuntimeFlags);

    this._runtimeFlags = newRuntimeFlags;

    return newRuntimeFlags;
  }

  private sendInterruptSignalToAllChildren(): boolean {
    if (this._children === null || this._children.size === 0) return false;
    else {
      let told = false;
      for (const child of this._children) {
        if (child !== null) {
          child.tell(FiberMessage.InterruptSignal(Cause.interrupt(this.id)));
          told = true;
        }
      }
      return told;
    }
  }

  private interruptAllChildren(): UIO<any> {
    if (this.sendInterruptSignalToAllChildren()) {
      const iterator = this._children[Symbol.iterator]();

      this._children = null!;

      let value: IteratorResult<FiberRuntime<any, any>>;

      const check = () => {
        value = iterator.next();
        return !value.done;
      };

      const body = () => {
        if (value != null && !value.done) {
          return value.value.await;
        } else {
          return IO.unit;
        }
      };

      return new WhileLoop(
        check,
        body,
        () => {
          //
        },
        this.id.location,
      );
    } else {
      return null!;
    }
  }

  private initiateAsync(runtimeFlags: RuntimeFlags, asyncRegister: (k: (_: IO<any, any, any>) => void) => any): void {
    let alreadyCalled = false;

    const callback = (effect: IO<any, any, any>) => {
      if (!alreadyCalled) {
        alreadyCalled = true;
        this.tell(FiberMessage.Resume(effect));
      }
    };

    if (runtimeFlags.interruptible) this.asyncInterruptor = callback;

    try {
      asyncRegister(callback);
    } catch (e) {
      callback(IO.failCauseNow(Cause.halt(e)));
    }
  }

  setFiberRef<A>(fiberRef: FiberRef<A>, value: A): void {
    this._fiberRefs = this._fiberRefs.updateAs(this.fiberId, fiberRef, value);
  }

  private addInterruptedCause(cause: Cause<never>): void {
    const oldSC = this.getFiberRef(FiberRef.interruptedCause);
    if (oldSC.contains(cause)) {
      return;
    }
    this.setFiberRef(FiberRef.interruptedCause, Cause.then(oldSC, cause));
  }

  private processNewInterruptSignal(cause: Cause<never>): void {
    this.addInterruptedCause(cause);
    this.sendInterruptSignalToAllChildren();
  }

  private evaluateMessageWhileSuspended(fiberMessage: FiberMessage): EvaluationSignal {
    switch (fiberMessage._tag) {
      case FiberMessageTag.InterruptSignal: {
        this.processNewInterruptSignal(fiberMessage.cause);

        if (this.asyncInterruptor !== null) {
          this.asyncInterruptor(IO.failCause(fiberMessage.cause));
          this.asyncInterruptor = null!;
        }

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.GenStackTrace: {
        fiberMessage.onTrace(this.generateStackTrace());
        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.Stateful: {
        let status: FiberStatus;
        if (this._exitValue !== null) {
          status = new Done();
        } else if (this.asyncTrace === null) {
          status = new Running(this._runtimeFlags, null!);
        } else {
          status = new Suspended(this._runtimeFlags, this.asyncBlockinOn, this.asyncTrace);
        }

        fiberMessage.onFiber(this, status);

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.Resume: {
        this.asyncInterruptor = null!;
        this.asyncTrace       = null!;
        this.asyncBlockinOn   = null!;

        this.evaluateEffect(fiberMessage.cont);

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.YieldNow: {
        return EvaluationSignal.YieldNow;
      }
    }
  }

  private generateStackTrace() {
    const builder = new StackTraceBuilder();

    const stack = this.stack.clone();
    while (stack.hasNext) {
      builder.append(TraceElement.parse(stack.pop()!.trace));
    }

    return new Trace(this.fiberId, builder.result());
  }

  private setExitValue(exit: Exit<E, A>): void {
    this._exitValue = exit;
    for (const observer of this.observers) {
      observer(exit);
    }
    this.observers = List.empty();
  }

  resume<R>(effect: IO<R, E, A>) {
    this.tell(FiberMessage.Resume(effect));
  }

  start<R>(effect: IO<R, E, A>) {
    if (!this.running) {
      try {
        this.running = true;
        this.evaluateEffect(effect);
      } finally {
        this.running = false;
        if (!this.queue.isEmpty) {
          this.drainQueueLaterOnExecutor();
        }
      }
    } else {
      this.tell(FiberMessage.Resume(effect));
    }
  }

  startFork<R>(effect: IO<R, E, A>): void {
    this.tell(FiberMessage.Resume(effect));
  }

  updateFiberRef<A>(fiberRef: FiberRef<A>, f: (a: A) => A): void {
    this.setFiberRef(fiberRef, f(this.getFiberRef(fiberRef)));
  }

  removeObserver(observer: (exit: Exit<E, A>) => void): void {
    this.observers = this.observers.filter((f) => f !== observer);
  }

  addChild(child: FiberRuntime<any, any>): void {
    this.getChildren().add(child);
  }

  removeChild(child: FiberRuntime<any, any>) {
    if (this._children !== null) {
      this._children.delete(child);
    }
  }

  get scope() {
    return FiberScope.unsafeMake(this);
  }

  log(message: () => string, cause: Cause<any>, overrideLogLevel: Maybe<LogLevel>, trace?: string): void {
    const logLevel    = overrideLogLevel.getOrElse(this.getFiberRef(FiberRef.currentLogLevel));
    const spans       = this.getFiberRef(FiberRef.currentLogSpan);
    const annotations = this.getFiberRef(FiberRef.currentLogAnnotations);
    const contextMap  = this.getFiberRefs();
    Logger.defaultString
      .map((s) => console.log(s))
      .filterLogLevel((level) => level >= LogLevel.Info)
      .log(
        TraceElement.parse(trace),
        this.fiberId,
        logLevel,
        message,
        cause,
        contextMap.unFiberRefs,
        spans,
        annotations,
      );
  }

  deleteFiberRef(ref: FiberRef<any>): void {
    this._fiberRefs = this._fiberRefs.delete(ref);
  }

  location = this.fiberId.location;

  get status(): UIO<FiberStatus> {
    return this.ask((_, status) => status);
  }

  get trace(): UIO<Trace> {
    return IO.defer(() => {
      const future = Future.unsafeMake<never, Trace>(this.fiberId);
      this.tell(FiberMessage.GenStackTrace((trace) => future.unsafeDone(IO.succeedNow(trace))));
      return future.await;
    });
  }

  getNextSuccessCont() {
    while (this.stack.hasNext) {
      const frame = this.stack.pop()!;
      if (frame.ioOpCode !== IOOpCode.OnFailure) {
        return frame;
      }
    }
  }

  getNextFailCont() {
    while (this.stack.hasNext) {
      const frame = this.stack.pop()!;
      if (frame.ioOpCode !== IOOpCode.OnSuccess && frame.ioOpCode !== IOOpCode.WhileLoop) {
        return frame;
      }
    }
  }

  isFatal(t: unknown): boolean {
    return this.getFiberRef(FiberRef.currentIsFatal).apply(t);
  }
}

const enum EvaluationSignal {
  Continue,
  YieldNow,
  Done,
}
