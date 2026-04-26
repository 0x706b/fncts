/* eslint perfectionist/sort-classes: "error" */

import type { Running } from "../FiberStatus.js";
import type { OnSuccess, OnSuccessAndFailure, UIO, UpdateRuntimeFlags } from "../IO/definition.js";
import type { WhileLoop } from "../IO/definition.js";
import type { RuntimeFlags } from "../RuntimeFlags.js";

import { IterableWeakSet } from "@fncts/base/collection/weak/IterableWeakSet";
import { EitherTag } from "@fncts/base/data/Either";
import { isIOError } from "@fncts/base/data/exceptions";
import { ExitTag } from "@fncts/base/data/Exit";
import { MaybeTag } from "@fncts/base/data/Maybe";
import { Trace } from "@fncts/base/data/Trace";
import { assert } from "@fncts/base/util/assert";
import { FiberTypeId, FiberVariance } from "@fncts/io/Fiber/definition";
import { StackTraceBuilder } from "@fncts/io/internal/StackTraceBuilder";

import { FiberStatus } from "../FiberStatus.js";
import { LinkedQueue } from "../internal/MutableQueue.js";
import { IOPrimitive } from "../IO/definition.js";
import { IOTag } from "../IO/definition.js";
import { RuntimeFlag } from "../RuntimeFlag.js";
import { FiberMessage, FiberMessageTag } from "./FiberMessage.js";

const MAX_FORKS_BEFORE_YIELD      = 128;
const MAX_DEPTH_BEFORE_TRAMPOLINE = 300;
const INITIAL_STACK_SIZE          = 16;
const STACK_IDX_GC_THRESHOLD      = 128;

export type Continuation = OnSuccess | OnSuccessAndFailure | WhileLoop | UpdateRuntimeFlags;

/**
 * @tsplus type fncts.io.Fiber
 */
export class FiberRuntime<E, A> implements Fiber.Runtime<E, A> {
  readonly _tag = "RuntimeFiber";

  readonly [FiberTypeId]: FiberTypeId = FiberTypeId;

  declare [FiberVariance]: {
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };

  get await(): UIO<Exit<E, A>> {
    return IO.defer(this.awaitUnsafe());
  }

  get children(): UIO<Conc<FiberRuntime<any, any>>> {
    return IO(this.childrenChunk(this._children));
  }

  get fiberRefs(): UIO<FiberRefs> {
    return IO(this._fiberRefs);
  }

  get id(): FiberId.Runtime {
    return this.fiberId;
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

  get location(): string | undefined {
    return this.fiberId.location;
  }

  get poll(): UIO<Maybe<Exit<E, A>>> {
    return IO.succeed(Maybe.fromNullable(this.exitValue()));
  }

  get runtimeFlags(): UIO<RuntimeFlags> {
    return IO(this._runtimeFlags);
  }

  get scope() {
    return FiberScope.unsafeMake(this);
  }

  get status(): UIO<FiberStatus> {
    return IO(this.getStatus());
  }

  get trace(): UIO<Trace> {
    return IO(this.generateStackTrace());
  }

  private _asyncContWith: ((_: IO<any, any, any>) => any) | null = null;
  private _blockingOn: FiberId | null   = null;
  private _children                     = null! as IterableWeakSet<FiberRuntime<any, any>>;
  private _exitValue: Exit<E, A> | null = null;
  private _fiberRefs: FiberRefs;
  private _forksSinceYield = 0;
  private _lastTrace: string | undefined;
  private _runtimeFlags: RuntimeFlags;
  private _stack     = null! as Array<Continuation>;
  private _stackSize = 0;
  private inbox      = new LinkedQueue<FiberMessage>();
  private observers  = List<(_: Exit<E, A>) => void>();
  private running    = false;

  constructor(
    readonly fiberId: FiberId.Runtime,
    fiberRefs0: FiberRefs,
    readonly runtimeFlags0: RuntimeFlags,
  ) {
    this._fiberRefs    = fiberRefs0;
    this._runtimeFlags = runtimeFlags0;
  }

  addChild(child: FiberRuntime<any, any>): void {
    this.getChildren().add(child);
  }

  addChildren(children: Iterable<FiberRuntime<any, any>>): void {
    if (this.isAlive()) {
      const childs = this.getChildren();
      if (this.shouldInterrupt()) {
        const cause = this.getInterruptedCause();
        for (const child of children) {
          if (child.isAlive()) {
            childs.add(child);
            child.tellInterrupt(cause);
          }
        }
      } else {
        for (const child of children) {
          if (child.isAlive()) {
            childs.add(child);
          }
        }
      }
    } else {
      const cause = this.getInterruptedCause();
      for (const child of children) {
        if (child.isAlive()) {
          child.tellInterrupt(cause);
        }
      }
    }
  }

  addObserver(observer: (exit: Exit<E, A>) => void): void {
    if (this._exitValue !== null) observer(this._exitValue);
    else this.observers = Cons(observer, this.observers);
  }

  deleteFiberRef(ref: FiberRef<any>): void {
    this._fiberRefs = this._fiberRefs.delete(ref);
  }

  exitValue(): Exit<E, A> | null {
    return this._exitValue;
  }

  generateStackTrace() {
    const builder = new StackTraceBuilder();

    const stack = this._stack;
    const size  = this._stackSize;

    if (stack !== null) {
      for (let i = stack.length < size ? stack.length : size; i >= 0; i--) {
        const k = stack[i];
        if (k != null) {
          builder.append(TraceElement.parse(k.trace));
        }
      }

      builder.append(TraceElement.parse(this.id.location));
    }
    return new Trace(this.fiberId, builder.result());
  }

  getChildren(): Set<FiberRuntime<any, any>> {
    let children = this._children;
    if (children === null) {
      children       = new IterableWeakSet();
      this._children = children;
    }
    return children;
  }

  getFiberRef<A>(fiberRef: FiberRef<A>): A {
    if (this._fiberRefs.unFiberRefs.has(fiberRef)) {
      return this._fiberRefs.unFiberRefs.unsafeGet(fiberRef)!.head[1] as A;
    }
    return fiberRef.initial;
  }

  getFiberRefs(): FiberRefs {
    return this._fiberRefs;
  }

  getInterruptedCause(): Cause<never> {
    return this.getFiberRef(FiberRef.interruptedCause);
  }

  getSupervisor(): Supervisor<any> {
    return this.getFiberRef(FiberRef.currentSupervisor);
  }

  interruptAs(fiberId: FiberId, __tsplusTrace?: string): UIO<Exit<E, A>> {
    return IO.defer(() => {
      const exit = this._exitValue;
      if (exit !== null) {
        return Exit.succeed(exit);
      } else {
        const cause = Cause.interrupt(fiberId, Trace(this.fiberId, Conc.single(TraceElement.parse(__tsplusTrace))));
        this.tell(FiberMessage.InterruptSignal(cause));
        return this.awaitUnsafe(__tsplusTrace);
      }
    });
  }

  interruptAsFork(fiberId: FiberId, __tsplusTrace?: string): UIO<void> {
    return IO.succeed(() => {
      const cause = Cause.interrupt(fiberId);
      this.tell(FiberMessage.InterruptSignal(cause));
    });
  }

  isAlive(): boolean {
    return this.exitValue === null;
  }

  isDone(): boolean {
    return this.exitValue !== null;
  }

  isFatal(t: unknown): boolean {
    return this.getFiberRef(FiberRef.currentIsFatal).apply(t);
  }

  isInterrupted(): boolean {
    return !this.getFiberRef(FiberRef.interruptedCause).isEmpty;
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

  removeChild(child: FiberRuntime<any, any>) {
    if (this._children !== null) {
      this._children.delete(child);
    }
  }

  removeObserver(observer: (exit: Exit<E, A>) => void): void {
    this.observers = this.observers.filter((f) => f !== observer);
  }

  resume<R>(effect: IO<R, E, A>) {
    this.tell(FiberMessage.Resume(effect));
  }

  runLoop(
    effect: IO.Concrete,
    minStackIndex: number,
    startStackIndex: number,
    currentDepth: number,
    currentOps: number,
  ): Exit<any, any> | null {
    assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    let op: IO.Concrete | null = effect;
    let ops                    = currentOps;
    let stackIndex             = startStackIndex;

    if (currentDepth >= MAX_DEPTH_BEFORE_TRAMPOLINE) {
      this.inbox.enqueue(FiberMessage.Resume(effect));
      return null;
    }

    while (true) {
      if ((this._runtimeFlags & RuntimeFlag.OpSupervision) !== 0) {
        this.getSupervisor().unsafeOnEffect(this, op!);
      }

      op = IO.concrete(this.drainQueueWhileRunning(op!));

      ops += 1;

      if (ops > this.getFiberRef(FiberRef.currentMaxFiberOps)) {
        this.updateLastTrace(op.trace);
        this.inbox.enqueue(FiberMessage.Resume(op));

        return null;
      }

      switch (op._ioOpCode) {
        case IOTag.SucceedNow: {
          const value = op.i0;

          op = null;

          while (op === null && stackIndex > minStackIndex) {
            stackIndex        -= 1;
            const continuation = this._stack[stackIndex];
            this.popStackFrame(stackIndex);
            switch (continuation._ioOpCode) {
              case IOTag.OnSuccess:
                op = continuation.i1(value);
                break;
              case IOTag.OnSuccessAndFailure:
                op = continuation.i2(value);
                break;
              case IOTag.UpdateRuntimeFlags:
                op = this.patchRuntimeFlags(continuation.i0, null, null);
                break;
            }
          }

          if (op === null) {
            return Exit.succeed(value);
          }

          break;
        }
        case IOTag.Sync: {
          this.updateLastTrace(op.trace);
          const value = op.i0();

          op = null;

          while (op === null && stackIndex > minStackIndex) {
            stackIndex        -= 1;
            const continuation = this._stack[stackIndex];
            this.popStackFrame(stackIndex);

            switch (continuation._ioOpCode) {
              case IOTag.OnSuccess:
                op = continuation.i1(value);
                break;
              case IOTag.OnSuccessAndFailure:
                op = continuation.i2(value);
                break;
              case IOTag.UpdateRuntimeFlags:
                op = this.patchRuntimeFlags(continuation.i0, null, null);
                break;
            }
          }

          if (op === null) {
            return Exit.succeed(value);
          }
          break;
        }
        case IOTag.OnSuccess: {
          this.updateLastTrace(op.trace);

          const first = op.i0;

          if (first === IO.unit) {
            op = op.i1(undefined);
          } else {
            stackIndex = this.pushStackFrame(op, stackIndex);

            const result = this.runLoop(first, stackIndex, stackIndex, currentDepth + 1, ops);
            ops         += 1;

            if (result === null) {
              return null;
            }

            stackIndex -= 1;
            this.popStackFrame(stackIndex);

            switch (result._tag) {
              case ExitTag.Success:
                op = op.i1(result.value);
                break;
              case ExitTag.Failure:
                op = IO.concrete(IO.failCauseNow(result.cause));
                break;
            }
          }
          break;
        }
        case IOTag.OnSuccessAndFailure: {
          this.updateLastTrace(op.trace);

          stackIndex = this.pushStackFrame(op, stackIndex);

          const result = this.runLoop(op.i0, stackIndex, stackIndex, currentDepth + 1, ops);
          ops         += 1;

          if (result === null) {
            return null;
          }

          stackIndex -= 1;
          this.popStackFrame(stackIndex);

          switch (result._tag) {
            case ExitTag.Success: {
              op = op.i2(result.value);
              break;
            }
            case ExitTag.Failure: {
              const cause = result.cause;
              if (this.shouldInterrupt()) {
                op = IO.concrete(IO.failCauseNow(cause.stripFailures));
              } else {
                op = op.i1(result.cause);
              }
            }
          }

          break;
        }
        case IOTag.Async: {
          this.updateLastTrace(op.trace);
          this._blockingOn = op.i1();

          op = this.initiateAsync(op.i0);

          if (op === null) {
            op = this.drainQueueAfterAsync();
          }

          if (op === null) {
            return null;
          }

          if (this.shouldInterrupt()) {
            op = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
          }

          break;
        }
        case IOTag.UpdateRuntimeFlagsWithin: {
          const trace = op.trace;
          this.updateLastTrace(trace);
          const updateFlags     = op.i0;
          const oldRuntimeFlags = this._runtimeFlags;
          const newRuntimeFlags = updateFlags.patch(oldRuntimeFlags);

          if (newRuntimeFlags === oldRuntimeFlags) {
            op = IO.concrete(op.i1(oldRuntimeFlags));
          } else {
            if (newRuntimeFlags.interruptible && this.isInterrupted()) {
              op = IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
            } else {
              this.patchRuntimeFlagsOnly(updateFlags);

              const revertFlags = newRuntimeFlags.diff(oldRuntimeFlags);

              const k = IO.updateRuntimeFlags(revertFlags, trace) as UpdateRuntimeFlags;

              stackIndex = this.pushStackFrame(k, stackIndex);

              const exit = this.runLoop(op.i1(oldRuntimeFlags), stackIndex, stackIndex, currentDepth + 1, ops);
              ops       += 1;

              if (exit === null) {
                return null;
              }

              stackIndex -= 1;
              this.popStackFrame(stackIndex);

              op = this.patchRuntimeFlags(revertFlags, exit.causeOrNull, exit);
            }
          }
          break;
        }
        case IOTag.Stateful: {
          const trace = op.trace;
          this.updateLastTrace(trace);
          op = op.i0(this, FiberStatus.running(this._runtimeFlags, trace) as Running);
          break;
        }
        case IOTag.Fail: {
          let cause = op.i0();

          op = null;

          while (op === null && stackIndex > minStackIndex) {
            stackIndex -= 1;

            const continuation = this._stack[stackIndex];

            this.popStackFrame(stackIndex);

            switch (continuation._ioOpCode) {
              case IOTag.OnSuccessAndFailure: {
                if (this.shouldInterrupt()) {
                  cause = cause.stripFailures;
                } else {
                  op = continuation.i1(cause);
                }
                break;
              }
              case IOTag.UpdateRuntimeFlags:
                op = this.patchRuntimeFlags(continuation.i0, cause, null);
                break;
            }
          }

          if (op === null) {
            return Exit.failCause(cause);
          }

          break;
        }
        case IOTag.UpdateRuntimeFlags: {
          this.updateLastTrace(op.trace);
          op = this.patchRuntimeFlags(op.i0, null, IO.unit);
          break;
        }
        case IOTag.WhileLoop: {
          const iterate = op;
          this.updateLastTrace(iterate.trace);
          const check   = iterate.i0;
          const body    = iterate.i1;
          const process = iterate.i2;

          stackIndex = this.pushStackFrame(iterate, stackIndex);

          op = null;

          const nextDepth = currentDepth + 1;

          while (op === null && check()) {
            const exit = this.runLoop(body(), stackIndex, stackIndex, nextDepth, ops);

            if (exit === null) {
              return null;
            }

            switch (exit._tag) {
              case ExitTag.Success:
                process(exit.value);
                break;
              case ExitTag.Failure:
                op = IO.concrete(IO.failCauseNow(exit.cause));
                break;
            }

            ops += 1;
          }

          stackIndex -= 1;
          this.popStackFrame(stackIndex);

          if (op === null) {
            op = IO.concrete(IO.unit);
          }

          break;
        }
        case IOTag.YieldNow: {
          this.updateLastTrace(op.trace);
          this.inbox.enqueue(FiberMessage.Resume(IO.unit));
          return null;
        }
        case IOTag.Commit: {
          op = IO.concrete(op.commit);
          break;
        }
        case IOTag.External: {
          op = IO.concrete(op.toIO);
          break;
        }
        case null: {
          switch (op._tag) {
            case MaybeTag.Just: {
              op = IO.concrete(IO.succeedNow(op.value));
              break;
            }
            case MaybeTag.Nothing: {
              op = IO.concrete(IO.failNow(new NoSuchElementError()));
              break;
            }
            case EitherTag.Left: {
              op = IO.concrete(IO.failNow(op.left));
              break;
            }
            case EitherTag.Right: {
              op = IO.concrete(IO.succeedNow(op.right));
              break;
            }
            case ExitTag.Failure: {
              op = IO.concrete(IO.failCauseNow(op.cause));
              break;
            }
            case ExitTag.Success: {
              op = IO.concrete(IO.succeedNow(op.value));
              break;
            }
            case "Tag": {
              op = IO.concrete(IO.service(op));
              break;
            }
          }
        }
      }
    }

    throw new Error("runLoop must exist with a return statement from within the while loop");
  }

  setFiberRef<A>(fiberRef: FiberRef<A>, value: A): void {
    this._fiberRefs = this._fiberRefs.updateAs(this.fiberId, fiberRef, value);
  }

  setFiberRefs(fiberRefs0: FiberRefs): void {
    this._fiberRefs = fiberRefs0;
  }

  shouldYieldBeforeFork(): boolean {
    if (this._runtimeFlags.cooperativeYielding) {
      this._forksSinceYield += 1;
      return this._forksSinceYield >= MAX_FORKS_BEFORE_YIELD;
    }

    return false;
  }

  start<R>(effect: IO<R, E, A>) {
    let result: Exit<E, A> | null = null;

    if (!this.running) {
      try {
        this.running = true;
        result       = this.evaluateEffect(0, IO.concrete(effect));
      } finally {
        this.running = false;
        if (!this.inbox.isEmpty) {
          this.running = true;
          this.drainQueueLaterOnExecutor();
        }
      }
    } else {
      this.tell(FiberMessage.Resume(effect));
    }

    return result;
  }

  startConcurrently(io: IO<any, E, A>): void {
    this.tell(FiberMessage.Resume(io));
  }

  startFork<R>(effect: IO<R, E, A>): void {
    this.tell(FiberMessage.Resume(effect));
  }

  startSuspended(): (io: IO<any, E, A>) => any {
    let alreadyCalled = false;
    const callback    = (io: IO<any, E, A>) => {
      if (!alreadyCalled) {
        alreadyCalled = true;
        this.tell(FiberMessage.Resume(io));
      }
    };

    this._asyncContWith = callback;

    return callback;
  }

  tell(message: FiberMessage): void {
    this.inbox.enqueue(message);
    if (!this.running) {
      this.running = true;
      this.drainQueueLaterOnExecutor();
    }
  }

  tellAddChild(child: FiberRuntime<any, any>): void {
    return this.tell(FiberMessage.Stateful((parentFiber) => parentFiber.addChild(child)));
  }

  tellAddChildren(children: Iterable<FiberRuntime<any, any>>): void {
    return this.tell(FiberMessage.Stateful((parentFiber) => parentFiber.addChildren(children)));
  }

  tellInterrupt(cause: Cause<never>): void {
    this.tell(FiberMessage.InterruptSignal(cause));
  }

  transferChildren(scope: FiberScope) {
    const children = this._children;
    if (children !== null && children.size > 0) {
      const childs   = this.childrenChunk(children);
      this._children = null!;
      if (!childs.isEmpty) {
        const flags = this._runtimeFlags;
        for (const child of childs) {
          scope.unsafeAdd(this, flags, child);
        }
      }
    }
  }

  updateFiberRef<A>(fiberRef: FiberRef<A>, f: (a: A) => A): void {
    this.setFiberRef(fiberRef, f(this.getFiberRef(fiberRef)));
  }

  private addInterruptedCause(cause: Cause<never>): void {
    const oldSC = this.getFiberRef(FiberRef.interruptedCause);
    if (oldSC.contains(cause)) {
      return;
    }
    this.setFiberRef(FiberRef.interruptedCause, Cause.sequential(oldSC, cause));
  }

  private awaitUnsafe(trace?: string): UIO<Exit<E, A>> {
    const exitValue = this._exitValue;
    if (exitValue !== null) {
      return Exit.succeed(exitValue);
    } else {
      return IO.asyncInterrupt<never, never, Exit<E, A>>(
        (k) => {
          const cb = (exit: Exit<any, any>) => k(IO.succeedNow(exit));
          this.addObserver(cb);
          return Either.left(IO(this.removeObserver(cb)));
        },
        this.id,
        trace,
      );
    }
  }

  private childrenChunk(children: IterableWeakSet<FiberRuntime<any, any>>): Conc<FiberRuntime<any, any>> {
    if (children === null) {
      return Conc.empty();
    }
    const builder = Conc.builder<FiberRuntime<any, any>>();
    children.forEach((child) => {
      if (child !== null) {
        builder.append(child);
      }
    });
    return builder.result();
  }

  private drainQueueAfterAsync(): IO.Concrete | null {
    let resumption: IO.Concrete | null = null;
    let message = this.inbox.dequeue(null!);

    while (message !== null) {
      switch (message._tag) {
        case FiberMessageTag.InterruptSignal:
          this.processNewInterruptSignal(message.cause);
          break;
        case FiberMessageTag.Stateful:
          this.processStatefulMessage(message.onFiber);
          break;
        case FiberMessageTag.Resume:
          resumption = IO.concrete(message.cont);
          break;
      }

      message = this.inbox.dequeue(null!);
    }

    return resumption;
  }

  private drainQueueLaterOnExecutor(): void {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    this.getFiberRef(FiberRef.currentScheduler).scheduleTask(() => this.run());
  }

  private drainQueueOnCurrentThread(depth: number): void {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");

    let recurse = true;

    while (recurse) {
      let evaluationSignal = EvaluationSignal.Continue;
      if (this._runtimeFlags.currentFiber) {
        // TODO
      }
      try {
        while (evaluationSignal === EvaluationSignal.Continue) {
          evaluationSignal = this.inbox.isEmpty
            ? EvaluationSignal.Done
            : this.evaluateMessageWhileSuspended(depth, this.inbox.dequeue(null!));
        }
      } finally {
        this.running = false;
        if (this._runtimeFlags.currentFiber) {
          // TODO
        }
      }

      if (!this.inbox.isEmpty && !this.running) {
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

  private drainQueueWhileRunning(cur0: IO.Concrete): IO<any, any, any> {
    let cur = cur0;

    let message = this.inbox.dequeue(null!);

    while (message) {
      switch (message._tag) {
        case FiberMessageTag.InterruptSignal: {
          this.updateLastTrace(cur.trace);
          this.processNewInterruptSignal(message.cause);
          if (this.isInterruptible()) {
            cur = IO.concrete(IO.failCauseNow(message.cause));
          }
          break;
        }
        case FiberMessageTag.Stateful: {
          this.processStatefulMessage(message.onFiber);
          break;
        }
        case FiberMessageTag.Resume: {
          throw new IllegalStateError("It is illegal to have multiple concurrent run loops in a single fiber");
        }
      }

      message = this.inbox.dequeue(null!);
    }

    return cur;
  }

  private ensureStackCapacity(size: number) {
    const stack       = this._stack;
    const stackLength = stack.length;
    if (stackLength < size) {
      const newSize  = (size & (size - 1)) == 0 ? size : highestOneBit(size) << 1;
      const newStack = new Array<Continuation>(newSize);
      copyArray(stack, 0, newStack, 0, stackLength);
      this._stack = newStack;
    }
  }

  private evaluateEffect(initialDepth: number, effect0: IO.Concrete): Exit<E, A> | null {
    // assert(this.running, "Invalid state in FiberRuntime: Fiber is not running");
    this._asyncContWith = null;
    this._blockingOn    = null;

    this.updateLastTrace(effect0.trace);

    const supervisor = this.getSupervisor();
    supervisor.unsafeOnResume(this);

    if (this._stack === null) {
      this._stack = new Array(INITIAL_STACK_SIZE);
    }

    try {
      let effect: IO.Concrete | null   = effect0;
      let finalExit: Exit<E, A> | null = null;

      while (effect !== null) {
        try {
          if (this.shouldInterrupt()) {
            effect = IO.concrete(IO.failCause(this.getInterruptedCause()));
          }

          const exit = this.runLoop(effect, 0, this._stackSize, initialDepth, 0);

          if (exit === null) {
            this._forksSinceYield = 0;
            effect                = null;
          } else {
            this._runtimeFlags = this._runtimeFlags.enable(RuntimeFlag.WindDown);
            const interruption = this.interruptAllChildren();

            if (interruption === null) {
              if (this.inbox.isEmpty) {
                finalExit = exit;

                supervisor.unsafeOnEnd(finalExit, this);

                this.setExitValue(exit);
              } else {
                this.tell(FiberMessage.Resume(IO.fromExitNow(exit)));
              }

              effect = null;
            } else {
              effect = IO.concrete(interruption.flatMap(() => IO.fromExitNow(exit), this.id.location));
            }
          }
        } catch (t) {
          if (this.isFatal(t)) {
            // TODO
          }

          if (isIOError(t)) {
            effect = IO.concrete(IO.failCauseNow(t.cause));
          } else {
            effect = IO.concrete(IO.failCauseNow(Cause.halt(t)));
          }
        }
      }

      return finalExit;
    } finally {
      this.gcStack();
      this.getSupervisor().unsafeOnSuspend(this);
    }
  }

  private evaluateMessageWhileSuspended(depth: number, fiberMessage: FiberMessage): EvaluationSignal {
    switch (fiberMessage._tag) {
      case FiberMessageTag.InterruptSignal: {
        this.processNewInterruptSignal(fiberMessage.cause);

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.Stateful: {
        this.processStatefulMessage(fiberMessage.onFiber);

        return EvaluationSignal.Continue;
      }
      case FiberMessageTag.Resume: {
        const nextEffect = fiberMessage.cont;
        const exit       = this.evaluateEffect(depth, IO.concrete(nextEffect));
        if (exit === null) {
          return EvaluationSignal.YieldNow;
        }
        return EvaluationSignal.Continue;
      }
    }
  }

  /**
   * Removes references of entries from the stack higher than the current index
   * so that they can be garbage collected.
   *
   * @note
   *   We only GC up to the {@link STACK_IDX_GC_THRESHOLD} index because
   *   we know that entries in indices higher than that have been auto-gc'd
   *   during the runloop
   * @note
   *   This method MUST be invoked by the fiber itself while it's still running.
   */
  private gcStack(): void {
    const fromIndex = this._stackSize;
    if (fromIndex === 0) {
      this._stack = null!;
    } else {
      const stack   = this._stack;
      const toIndex = Math.min(STACK_IDX_GC_THRESHOLD, stack.length);

      if (fromIndex < toIndex && stack[fromIndex] !== null) {
        stack.fill(null!, fromIndex, toIndex);
      }
    }
  }

  private getStatus(): FiberStatus {
    if (this._exitValue !== null) {
      return FiberStatus.done;
    } else {
      if (this._asyncContWith !== null) {
        return FiberStatus.suspended(this._runtimeFlags, this._blockingOn ?? FiberId.none, this._lastTrace);
      } else {
        return FiberStatus.running(this._runtimeFlags, this._lastTrace);
      }
    }
  }

  private initiateAsync(asyncRegister: (k: (_: IO<any, any, any>) => void) => any): IO.Concrete | null {
    let alreadyCalled = false;

    const callback = (effect: IO<any, any, any>) => {
      if (!alreadyCalled) {
        alreadyCalled = true;
        this.tell(FiberMessage.Resume(effect));
      }
    };

    if (this.isInterruptible()) {
      this._asyncContWith = callback;
    } else {
      this._asyncContWith = () => void 0;
    }

    try {
      const sync = asyncRegister(callback);

      if (sync != null) {
        if (!alreadyCalled) {
          alreadyCalled       = true;
          this._asyncContWith = null;
          this._blockingOn    = null;
          return sync;
        } else {
          this.log(
            () =>
              "Async operation attempted synchronous resumption, but its callback was already invoked; synchronous value will be discarded",
            Cause.empty(),
            Just(LogLevel.Error),
            this.id.location,
          );

          return null;
        }
      } else {
        return null;
      }
    } catch (t) {
      callback(IO.failCauseNow(Cause.halt(t)));

      return null;
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

      const io = new IOPrimitive(IOTag.WhileLoop) as any;
      io.i0    = check;
      io.i1    = body;
      io.i2    = () => {
        //
      };

      return io;
    } else {
      return null!;
    }
  }

  private isInterruptible() {
    return this._runtimeFlags.interruptible;
  }

  private patchRuntimeFlags<R, E, A>(
    patch: RuntimeFlags.Patch,
    cause: Cause<E> | null,
    continueEffect: IO<R, E, A> | null,
  ): IO.Concrete | null {
    const changed          = this.patchRuntimeFlagsOnly(patch);
    const interruptEnabled = patch.isEnabled(RuntimeFlag.Interruption);

    if (changed && interruptEnabled && this.shouldInterrupt()) {
      if (cause !== null) {
        return IO.concrete(IO.failCauseNow(Cause.sequential(cause, this.getInterruptedCause())));
      } else {
        return IO.concrete(IO.failCauseNow(this.getInterruptedCause()));
      }
    } else if (cause !== null) {
      return IO.concrete(IO.failCauseNow(cause));
    } else {
      return IO.concrete(continueEffect!);
    }
  }

  private patchRuntimeFlagsOnly(patch: RuntimeFlags.Patch): boolean {
    const oldFlags = this._runtimeFlags;
    const newFlags = patch.patch(oldFlags);
    const changed  = oldFlags !== newFlags;
    if (changed) {
      if (patch.isEnabled(RuntimeFlag.CurrentFiber)) {
        // TODO
      } else {
        // TODO
      }

      this._runtimeFlags = newFlags;
    }

    return changed;
  }

  /**
   * Sets the `_stackSize` to `nextStackIndex`.
   *
   * This method might also null out the entry in the stack to allow it to be
   * GC'd, but only if the index is >= `FiberRuntime.StackIdxGcThreshold`.
   *
   * This is based on the assumption that when the stack is shallow, the entries
   * in the array will keep being overwritten as the pointer moves up and down.
   */
  private popStackFrame(nextStackIndex: number): void {
    if (nextStackIndex >= STACK_IDX_GC_THRESHOLD) {
      this._stack[nextStackIndex] = null!;
    }
    this._stackSize = nextStackIndex;
  }

  private processNewInterruptSignal(cause: Cause<never>): void {
    this.addInterruptedCause(cause);
    this.sendInterruptSignalToAllChildren();

    const k = this._asyncContWith;

    if (k !== null) {
      k(IO.failCauseNow(cause));
    }
  }

  private processStatefulMessage(onFiber: (_: FiberRuntime<any, any>) => void): void {
    try {
      onFiber(this);
    } catch (t) {
      if (this.isFatal(t)) {
        // TODO
      } else {
        this.log(
          () => `An unexpected error was encountered while processing stateful fiber message with callback ${onFiber}`,
          Cause.halt(t),
          Just(LogLevel.Error),
          this.id.location,
        );
      }
    }
  }

  private pushStackFrame(k: Continuation, stackIndex: number): number {
    const newSize = stackIndex + 1;

    this.ensureStackCapacity(newSize);

    this._stack[stackIndex] = k;
    this._stackSize         = newSize;

    return newSize;
  }

  private run(): void {
    this.drainQueueOnCurrentThread(0);
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

  private setExitValue(exit: Exit<E, A>): void {
    this._exitValue = exit;
    for (const observer of this.observers) {
      observer(exit);
    }
    this.observers = List.empty();
  }

  private shouldInterrupt() {
    return this.isInterruptible() && this.isInterrupted();
  }

  private updateLastTrace(newTrace?: string): void {
    if (newTrace !== null && newTrace !== "" && this._lastTrace !== newTrace) {
      this._lastTrace = newTrace;
    }
  }
}

const enum EvaluationSignal {
  Continue,
  YieldNow,
  Done,
}

export function highestOneBit(i: number) {
  i |= i >> 1;
  i |= i >> 2;
  i |= i >> 4;
  i |= i >> 8;
  i |= i >> 16;
  return i - (i >>> 1);
}

function copyArray<A>(
  source: ArrayLike<A>,
  sourcePos: number,
  dest: Array<A> | Uint8Array,
  destPos: number,
  length: number,
): void {
  const j = Math.min(source.length, sourcePos + length);
  for (let i = sourcePos; i < j; i++) {
    dest[destPos + i - sourcePos] = source[i]!;
  }
}
