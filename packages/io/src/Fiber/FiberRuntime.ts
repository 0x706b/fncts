import type { FiberStatus } from "../FiberStatus.js";
import type { EvaluationStep, UIO } from "../IO/definition.js";
import type { RuntimeFlags } from "../RuntimeFlags.js";

import { Trace } from "@fncts/base/data/Trace";
import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { assert } from "@fncts/base/util/assert";
import { FiberTypeId } from "@fncts/io/Fiber/definition";

import { Done, Suspended } from "../FiberStatus.js";
import { Running } from "../FiberStatus.js";
import { FiberStatusTag } from "../FiberStatus.js";
import { LinkedQueue } from "../internal/MutableQueue.js";
import { PinchableArray } from "../internal/PinchableArray.js";
import { isReifyStack, ReifyStack, ReifyStackTag } from "../internal/ReifyStack.js";
import { defaultScheduler } from "../internal/Scheduler.js";
import { WhileLoop } from "../IO/definition.js";
import { IOError, IOTag, OnSuccess, UpdateRuntimeFlagsEvaluationStep, UpdateTrace } from "../IO/definition.js";
import { isIOError } from "../IO/definition.js";
import { RuntimeFlag } from "../RuntimeFlag.js";
import { FiberMessage, FiberMessageTag } from "./FiberMessage.js";

type Erased = IO<any, any, any>;

/**
 * @tsplus type fncts.io.Fiber
 */
export class FiberRuntime<E, A> implements Fiber.Runtime<E, A> {
  readonly _E!: () => E;
  readonly _A!: () => A;
  readonly _typeId: FiberTypeId = FiberTypeId;
  readonly _tag                 = "RuntimeFiber";
  constructor(readonly fiberId: FiberId.Runtime, fiberRefs0: FiberRefs, readonly runtimeFlags0: RuntimeFlags) {
    this._fiberRefs    = fiberRefs0;
    this._runtimeFlags = runtimeFlags0;
  }

  private _fiberRefs: FiberRefs;
  private _runtimeFlags: RuntimeFlags;
  private queue            = new LinkedQueue<FiberMessage>();
  private _children        = null! as Set<FiberRuntime<any, any>>;
  private observers        = List<(_: Exit<E, A>) => void>();
  private running          = new AtomicBoolean(false);
  private reifiedStack     = new PinchableArray<EvaluationStep>(-1);
  private asyncEffect      = null! as IO<any, any, any>;
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

      this.tell(FiberMessage.Stateful((fiber, status) => future.unsafeDone(IO.succeedNow(f(fiber, status)))));

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

  run(): void {
    this.drainQueueOnCurrentThread();
  }

  private drainQueueOnCurrentThread(): void {
    assert(this.running.get, "Invalid state in FiberRuntime: Fiber is not running");

    let evaluationSignal = EvaluationSignal.Continue;

    if (this._runtimeFlags.currentFiber) {
    }

    try {
      while (evaluationSignal === EvaluationSignal.Continue) {
        if (this.queue.isEmpty) {
          evaluationSignal = EvaluationSignal.Done;
        } else {
          this.evaluateMessageWhileSuspended(this.queue.dequeue(null!));
        }
      }
    } finally {
      this.running.set(false);

      if (this._runtimeFlags.currentFiber) {
      }
    }

    if (!this.queue.isEmpty && this.running.compareAndSet(false, true)) {
      if ((evaluationSignal as EvaluationSignal) === EvaluationSignal.YieldNow) this.drainQueueLaterOnExecutor();
      else this.drainQueueOnCurrentThread();
    }
  }

  private drainQueueLaterOnExecutor(): void {
    assert(this.running.get, "Invalid state in FiberRuntime: Fiber is not running");

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
          this.processStatefulMessage(message.onFiber, new Running(runtimeFlags, lastTrace));
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

  private evaluateEffect(effect0: IO<any, any, any>): Exit<E, A> {
    assert(this.running.get, "Invalid state in FiberRuntime: Fiber is not running");

    this.getSupervisor().unsafeOnResume(this);

    try {
      let effect: IO<any, any, any>;

      if (this._runtimeFlags.interruptible && this.isInterrupted()) {
        effect = IO.failCause(this.getInterruptedCause());
      } else {
        effect = effect0;
      }

      let trampolines = 0;
      let finalExit   = null! as Exit<E, A>;

      while (effect !== null) {
        try {
          const localStack = this.reifiedStack.pinch();

          let exit: Exit<E, A> = null!;
          try {
            exit = Exit.succeed(this.runLoop(effect, 0, localStack, this._runtimeFlags) as A);
          } catch (e) {
            if (isIOError(e)) {
              exit = Exit.failCause(e.cause) as Exit<E, A>;
            } else {
              throw e;
            }
          }

          this._runtimeFlags = this._runtimeFlags.enable(RuntimeFlag.WindDown);

          const interruption = this.interruptAllChildren();

          if (interruption === null) {
            if (this.queue.isEmpty) {
              finalExit = exit;
              this.setExitValue(exit);
            } else {
              this.asyncEffect = IO.fromExitNow(exit);
              this.tell(FiberMessage.Resume);
            }

            effect = null!;
          } else {
            effect = interruption.flatMap(() => IO.fromExitNow(exit), this.id.location.show);
          }
        } catch (e) {
          if (isReifyStack(e)) {
            switch (e._tag) {
              case ReifyStackTag.Trampoline: {
                trampolines += 1;

                if ((trampolines >= 5 || e.forceYield) && this._runtimeFlags.cooperativeYielding) {
                  this.asyncEffect = e.effect;

                  this.tell(FiberMessage.YieldNow);
                  this.tell(FiberMessage.Resume);

                  effect = null!;
                } else {
                  effect = e.effect;
                }

                break;
              }
              case ReifyStackTag.AsyncJump: {
                effect = null!;
                break;
              }
              case ReifyStackTag.GenerateTrace: {
                effect = IO.succeedNow(this.generateStackTrace());
              }
            }
          } else {
            // TODO: use this.log
            console.log(Cause.halt(e, Trace(this.id, Conc(this.id.location))));
            effect = null!;
          }
        }
      }
      return finalExit;
    } finally {
      this.getSupervisor().unsafeOnSuspend(this);
    }
  }

  runLoop(
    effect: IO<any, any, any>,
    currentDepth: number,
    localStack: Conc<EvaluationStep>,
    runtimeFlags0: RuntimeFlags,
  ): any {
    assert(this.running.get, "Invalid state in FiberRuntime: Fiber is not running");

    let cur          = IO.concrete(effect);
    let done         = null! as any;
    let stackIndex   = 0;
    let runtimeFlags = runtimeFlags0;
    let lastTrace    = undefined! as string;
    let ops          = 0;

    if (currentDepth >= 500) {
      this.reifiedStack.ensureCapacity(currentDepth);
      this.reifiedStack.pushAll(localStack);
      throw ReifyStack.Trampoline(effect, false);
    }

    while (cur !== null) {
      if (runtimeFlags.opSupervision) {
        this.getSupervisor().unsafeOnEffect(this, cur);
      }
      const nextTrace = IO.concrete(cur).trace;
      if (nextTrace !== undefined) lastTrace = nextTrace;

      cur = IO.concrete(this.drainQueueWhileRunning(runtimeFlags, lastTrace, cur));

      ops += 1;

      if (ops > 1024) {
        ops          = 0;
        const oldCur = cur;
        const trace  = lastTrace;
        cur          = IO.concrete(IO.yieldNow.flatMap(() => oldCur, trace));
      } else {
        try {
          switch (cur._tag) {
            case IOTag.OnSuccess: {
              const effect = cur;
              try {
                cur = IO.concrete(
                  cur.successK(this.runLoop(effect.first, currentDepth + 1, Conc.empty(), runtimeFlags)),
                );
              } catch (e) {
                if (isIOError(e)) {
                  cur = IO.concrete(IO.failCauseNow(e.cause));
                } else if (isReifyStack(e)) {
                  this.reifiedStack.push(effect);
                  throw e;
                } else {
                  throw e;
                }
              }
              break;
            }
            case IOTag.Sync: {
              try {
                const value = cur.evaluate();
                cur         = null!;
                while (cur === null && stackIndex < localStack.length) {
                  const element = localStack.unsafeGet(stackIndex);
                  stackIndex   += 1;
                  switch (element._tag) {
                    case IOTag.OnSuccess: {
                      cur = IO.concrete(element.successK(value));
                      break;
                    }
                    case IOTag.OnSuccessAndFailure: {
                      cur = IO.concrete(element.successK(value));
                      break;
                    }
                    case IOTag.OnFailure: {
                      break;
                    }
                    case "UpdateRuntimeFlags": {
                      runtimeFlags = this.patchRuntimeFlags(runtimeFlags, element.update);
                      if (runtimeFlags.interruptible && this.isInterrupted()) {
                        cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
                      }
                      break;
                    }
                    case "UpdateTrace": {
                      if (element.trace !== undefined) lastTrace = element.trace;
                    }
                  }
                }
                if (cur === null) {
                  done = value;
                }
              } catch (e) {
                if (isIOError(e)) {
                  cur = IO.concrete(IO.failCauseNow(e.cause));
                } else {
                  throw e;
                }
              }
              break;
            }
            case IOTag.OnFailure: {
              const effect = cur;
              try {
                cur = IO.concrete(
                  IO.succeedNow(this.runLoop(effect.first, currentDepth + 1, Conc.empty(), runtimeFlags)),
                );
              } catch (e) {
                if (isIOError(e)) {
                  cur = IO.concrete(effect.onFailure(e.cause));
                } else if (isReifyStack(e)) {
                  this.reifiedStack.push(effect);
                  throw e;
                }
              }
              break;
            }
            case IOTag.OnSuccessAndFailure: {
              const effect = cur;
              try {
                cur = IO.concrete(
                  effect.successK(this.runLoop(cur.first, currentDepth + 1, Conc.empty(), runtimeFlags)),
                );
              } catch (e) {
                if (isIOError(e)) {
                  cur = IO.concrete(effect.failureK(e.cause));
                } else if (isReifyStack(e)) {
                  this.reifiedStack.push(effect);
                  throw e;
                } else {
                  throw e;
                }
              }
              break;
            }
            case IOTag.Async: {
              this.reifiedStack.ensureCapacity(currentDepth);
              this.asyncTrace     = lastTrace;
              this.asyncBlockinOn = cur.blockingOn();

              this.initiateAsync(runtimeFlags, cur.registerCallback);

              throw ReifyStack.AsyncJump;
            }
            case IOTag.Interruptible:
            case IOTag.Uninterruptible:
            case IOTag.Dynamic: {
              const updateFlags     = cur.update;
              const oldRuntimeFlags = runtimeFlags;
              const newRuntimeFlags = updateFlags.patch(oldRuntimeFlags);

              if (newRuntimeFlags === oldRuntimeFlags) {
                cur = IO.concrete(cur.scope(oldRuntimeFlags));
              } else {
                if (newRuntimeFlags.interruptible && this.isInterrupted()) {
                  cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
                } else {
                  runtimeFlags      = this.patchRuntimeFlags(runtimeFlags, updateFlags);
                  const revertFlags = newRuntimeFlags.diff(oldRuntimeFlags);

                  try {
                    const value = this.runLoop(
                      cur.scope(oldRuntimeFlags),
                      currentDepth + 1,
                      Conc.empty(),
                      runtimeFlags,
                    );

                    runtimeFlags = this.patchRuntimeFlags(runtimeFlags, revertFlags);

                    if (runtimeFlags.interruptible && this.isInterrupted()) {
                      cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
                    } else {
                      cur = IO.concrete(IO.succeedNow(value));
                    }
                  } catch (e) {
                    if (isIOError(e)) {
                      cur = IO.concrete(IO.failCauseNow(e.cause));
                    } else if (isReifyStack(e)) {
                      this.reifiedStack.push(new UpdateRuntimeFlagsEvaluationStep(revertFlags));

                      throw e;
                    } else {
                      throw e;
                    }
                  }
                }
              }

              break;
            }
            case IOTag.GenerateStackTrace: {
              this.reifiedStack.push(new UpdateTrace(cur.trace));
              throw ReifyStack.GenerateTrace;
            }
            case IOTag.Stateful: {
              try {
                cur = IO.concrete(cur.onState(this, new Running(runtimeFlags, lastTrace)));
              } catch (e) {
                if (isIOError(e)) {
                  cur = IO.concrete(IO.failCauseNow(e.cause));
                } else {
                  throw e;
                }
              }
              break;
            }
            case IOTag.SucceedNow: {
              const value = cur.value;
              cur         = null!;

              while (cur === null && stackIndex < localStack.length) {
                const element = localStack.unsafeGet(stackIndex);
                stackIndex   += 1;

                switch (element._tag) {
                  case IOTag.OnSuccess: {
                    cur = IO.concrete(element.successK(value));
                    break;
                  }
                  case IOTag.OnSuccessAndFailure: {
                    cur = IO.concrete(element.successK(value));
                    break;
                  }
                  case IOTag.OnFailure: {
                    break;
                  }
                  case "UpdateRuntimeFlags": {
                    runtimeFlags = this.patchRuntimeFlags(runtimeFlags, element.update);
                    if (runtimeFlags.interruptible && this.isInterrupted()) {
                      cur = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
                    }
                    break;
                  }
                  case "UpdateTrace": {
                    if (element.trace !== undefined) lastTrace = element.trace;
                  }
                }
              }

              if (cur === null) {
                done = value;
              }
              break;
            }
            case IOTag.Fail: {
              let cause = cur.cause();
              cur       = null!;

              while (cur === null && stackIndex < localStack.length) {
                const element = localStack.unsafeGet(stackIndex);

                stackIndex += 1;

                switch (element._tag) {
                  case IOTag.OnSuccess:
                    break;
                  case IOTag.OnFailure:
                  case IOTag.OnSuccessAndFailure: {
                    if (!(runtimeFlags.interruptible && this.isInterrupted())) {
                      cur = IO.concrete(element.failureK(cause));
                    } else {
                      cause = cause.stripFailures;
                    }
                    break;
                  }
                  case "UpdateRuntimeFlags": {
                    runtimeFlags = this.patchRuntimeFlags(runtimeFlags, element.update);

                    if (runtimeFlags.interruptible && this.isInterrupted()) {
                      const interruptedCause = this.getInterruptedCause();
                      if (cause.contains(interruptedCause)) {
                        cur = IO.concrete(IO.failCauseNow(cause));
                      } else {
                        cur = IO.concrete(IO.failCauseNow(Cause.then(cause, this.getInterruptedCause())));
                      }
                    }
                    break;
                  }
                  case "UpdateTrace": {
                    if (element.trace !== undefined) lastTrace = element.trace;
                  }
                }
              }

              if (cur === null) {
                throw new IOError(cause);
              }
              break;
            }
            case IOTag.UpdateRuntimeFlags: {
              runtimeFlags = this.patchRuntimeFlags(runtimeFlags, cur.update);

              if (currentDepth > 0) {
                this.reifiedStack.ensureCapacity(currentDepth);
                throw ReifyStack.Trampoline(IO.unit, false);
              } else {
                cur = IO.concrete(IO.unit);
              }

              break;
            }
            case IOTag.WhileLoop: {
              const iterate = cur;
              const check   = iterate.check;
              try {
                while (check()) {
                  const result = this.runLoop(iterate.body(), currentDepth + 1, Conc.empty(), runtimeFlags);
                  iterate.process(result);
                }

                cur = IO.concrete(IO.unit);
              } catch (e) {
                if (isIOError(e)) {
                  cur = IO.concrete(IO.failCauseNow(e.cause));
                } else if (isReifyStack(e)) {
                  this.reifiedStack.push(
                    new OnSuccess(null!, (element) => {
                      iterate.process(element);
                      return iterate;
                    }),
                  );

                  throw e;
                } else {
                  throw e;
                }
              }
              break;
            }
            case IOTag.YieldNow: {
              this.reifiedStack.push(new UpdateTrace(cur.trace));
              throw ReifyStack.Trampoline(IO.unit, true);
            }
          }
        } catch (e) {
          if (isIOError(e)) {
            assert(stackIndex >= localStack.length, "");
            throw e;
          } else if (isReifyStack(e)) {
            if (stackIndex < localStack.length) {
              this.reifiedStack.pushAll(localStack.drop(stackIndex));
            }
            throw e;
          } else if (isInterruptedException(e)) {
            cur = IO.concrete(IO.failCauseNow(Cause.both(Cause.halt(e), Cause.interrupt(FiberId.none))));
          } else {
            cur = IO.concrete(IO.failCauseNow(Cause.halt(e)));
          }
        }
      }
    }
    return done;
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
    if (this.running.compareAndSet(false, true)) this.drainQueueLaterOnExecutor();
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
        this.id.location.show,
      );
    } else {
      return null!;
    }
  }

  private initiateAsync(runtimeFlags: RuntimeFlags, asyncRegister: (k: (_: IO<any, any, any>) => void) => any): void {
    const alreadyCalled = new AtomicBoolean(false);

    const callback = (effect: IO<any, any, any>) => {
      if (alreadyCalled.compareAndSet(false, true)) {
        this.asyncEffect = effect;
        this.tell(FiberMessage.Resume);
      } else {
        console.log("An async callback was invoked more than once");
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
    this._fiberRefs = this._fiberRefs.updatedAs(this.fiberId, fiberRef, value);
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
    assert(this.running.get, "Invalid state in FiberRuntime: Fiber is not running");

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

        this.processStatefulMessage(fiberMessage.onFiber, status);

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.Resume: {
        const nextEffect = this.asyncEffect;

        this.asyncInterruptor = null!;
        this.asyncTrace       = null!;
        this.asyncBlockinOn   = null!;
        this.asyncEffect      = null!;

        this.evaluateEffect(nextEffect);

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.YieldNow: {
        return EvaluationSignal.YieldNow;
      }
    }
  }

  private processStatefulMessage(
    onFiber: (fiber: FiberRuntime<any, any>, status: FiberStatus) => void,
    status: FiberStatus,
  ): void {
    try {
      onFiber(this, status);
    } catch (e) {
      //
    }
  }

  private generateStackTrace() {
    return Trace.none;
  }

  private setExitValue(exit: Exit<E, A>): void {
    this._exitValue = exit;
    for (const observer of this.observers) {
      observer(exit);
    }
    this.observers = List.empty();
  }

  start<R>(effect: IO<R, E, A>): Exit<E, A> {
    if (this.running.compareAndSet(false, true)) {
      try {
        return this.evaluateEffect(effect);
      } finally {
        this.running.set(false);
        if (!this.queue.isEmpty && this.running.compareAndSet(false, true)) this.drainQueueLaterOnExecutor();
      }
    } else {
      this.asyncEffect = effect;

      this.tell(FiberMessage.Resume);

      return null!;
    }
  }

  startFork<R>(effect: IO<R, E, A>): void {
    this.asyncEffect = effect;
    this.tell(FiberMessage.Resume);
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
        contextMap.fiberRefLocals,
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
}

const enum EvaluationSignal {
  Continue,
  YieldNow,
  Done,
}
