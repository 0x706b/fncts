import type { Instruction, Match, Race } from "@fncts/base/control/IO/definition";

import { concrete, IOTag, isIOError } from "@fncts/base/control/IO/definition";
import { CancellerState } from "@fncts/base/data/CancellerState";
import { ExitTag } from "@fncts/base/data/Exit";
import { FiberState } from "@fncts/base/data/FiberState";
import { FiberStatus, FiberStatusTag } from "@fncts/base/data/FiberStatus";
import { AtomicReference } from "@fncts/base/internal/AtomicReference";
import { defaultScheduler } from "@fncts/base/internal/Scheduler";
import { Stack } from "@fncts/base/internal/Stack";
import { StackTraceBuilder } from "@fncts/base/internal/StackTraceBuilder";

export type FiberRefLocals = Map<FiberRef.Runtime<any>, unknown>;

type Erased = IO<any, any, any>;
type ErasedCont = (a: any) => Erased;

export class InterruptExit {
  readonly _tag = "InterruptExit";
  constructor(readonly apply: ErasedCont, readonly trace?: string) {}
}

export class HandlerFrame {
  readonly _tag = "HandlerFrame";
  constructor(readonly apply: ErasedCont, readonly trace?: string) {}
}

export class TracedCont {
  readonly _tag = "TracedCont";
  constructor(readonly apply: ErasedCont, readonly trace?: string) {}
}

export class Finalizer {
  readonly _tag = "Finalizer";
  constructor(readonly finalizer: UIO<any>, readonly apply: ErasedCont, readonly trace?: string) {}
}

export type Frame =
  | InterruptExit
  | Match<any, any, any, any, any, any, any, any, any>
  | HandlerFrame
  | TracedCont
  | Finalizer;

export const currentFiber = new AtomicReference<FiberContext<any, any> | null>(null);

export function unsafeCurrentFiber(): Maybe<FiberContext<any, any>> {
  return Maybe.fromNullable(currentFiber.get);
}

/**
 * `FiberContext` provides all of the context and facilities required to run a `IO`
 *
 * @tsplus type fncts.control.Fiber
 */
export class FiberContext<E, A> implements Fiber.Runtime<E, A> {
  readonly _tag = "RuntimeFiber";

  private state = FiberState.initial<E, A>();

  private asyncEpoch         = 0 | 0;
  private stack              = undefined as Stack<Frame> | undefined;
  nextIO: Instruction | null = null;
  private currentSupervisor: Supervisor<any>;

  constructor(
    protected readonly fiberId: FiberId,
    private runtimeConfig: RuntimeConfig,
    private interruptStatus: Stack<boolean> | undefined,
    private readonly fiberRefLocals: FiberRefLocals,
    private readonly children: Set<FiberContext<unknown, unknown>>,
    private readonly location?: string,
  ) {
    this.currentSupervisor = this.runtimeConfig.supervisor;
  }

  get poll() {
    return IO.succeed(() => this.unsafePoll());
  }

  get inheritRefs() {
    return IO.defer(() => {
      if (this.fiberRefLocals.size === 0) {
        return IO.unit;
      } else {
        return IO.foreachDiscard(this.fiberRefLocals, ([fiberRef, value]) =>
          fiberRef.update((old) => fiberRef.join(old, value)),
        );
      }
    });
  }

  getRef<A>(ref: FiberRef.Runtime<A>): UIO<A> {
    return IO.succeed(() => (this.fiberRefLocals.get(ref) as A) || ref.initial);
  }

  get id() {
    return this.fiberId;
  }

  awaitAsync(k: FiberState.Callback<E, A>) {
    const exit = this.unsafeAddObserver((exit) => k(exit.flatten));

    if (exit != null) {
      k(exit);
    }
  }

  get await(): UIO<Exit<E, A>> {
    return IO.asyncInterrupt((k): Either<UIO<void>, UIO<Exit<E, A>>> => {
      const cb: FiberState.Callback<never, Exit<E, A>> = (x) => k(IO.fromExit(x));
      const result = this.unsafeAddObserver(cb);
      if (result == null) {
        return Either.left(IO.succeed(() => this.unsafeRemoveObserver(cb)));
      } else {
        return Either.right(IO.succeedNow(result));
      }
    }, this.fiberId);
  }

  run(): void {
    this.runUntil(this.runtimeConfig.yieldOpCount);
  }

  get scope(): FiberScope {
    return FiberScope.unsafeMake(this);
  }

  get status(): UIO<FiberStatus> {
    return IO.succeedNow(this.state.status);
  }

  get name(): Maybe<string> {
    return (this.fiberRefLocals.get(FiberRef.fiberName) as Maybe<string>) || Nothing();
  }

  get trace(): UIO<Trace> {
    return IO.succeed(() => this.unsafeCaptureTrace(List.empty()));
  }

  interruptAs(fiberId: FiberId): UIO<Exit<E, A>> {
    return this.unsafeInterruptAs(fiberId);
  }

  evalOn(effect: UIO<any>, orElse: UIO<any>): UIO<void> {
    return IO.defer(() => this.unsafeEvalOn(effect, orElse));
  }

  /**
   * The main evaluator loop for the fiber. For purely synchronous effects, this will run either
   * to completion, or for the specified maximum operation count. For effects with asynchronous
   * callbacks, the loop will proceed no further than the first asynchronous boundary.
   */
  runUntil(maxOpCount: number): void {
    try {
      let current: Instruction | null = this.nextIO;

      this.nextIO = null;

      let extraTrace: string | undefined = undefined;

      const flags = this.runtimeConfig.flags;

      const superviseOps =
        flags.isEnabled(RuntimeConfigFlag.SuperviseOperations) &&
        this.currentSupervisor !== Supervisor.none;

      this.runtimeConfig.flags.isEnabled(RuntimeConfigFlag.EnableCurrentFiber) &&
        currentFiber.set(this);

      this.currentSupervisor !== Supervisor.none && this.currentSupervisor.unsafeOnResume(this);

      while (current !== null) {
        try {
          let opCount = 0;
          while (current !== null) {
            if (!this.unsafeShouldInterrupt) {
              const message = this.unsafeDrainMailbox();
              if (message !== null) {
                const oldIO = current;
                current     = concrete(message.chain(() => oldIO));
              } else if (opCount === maxOpCount) {
                this.unsafeRunLater(current);
                current = null;
              } else {
                superviseOps && this.currentSupervisor.unsafeOnEffect(this, current);
                switch (current._tag) {
                  case IOTag.Chain: {
                    const nested = concrete(current.io);
                    const k      = current.f;

                    switch (nested._tag) {
                      case IOTag.SucceedNow: {
                        current = concrete(k(nested.value));
                        break;
                      }
                      case IOTag.Succeed: {
                        extraTrace  = nested.trace;
                        const value = nested.effect();
                        extraTrace  = undefined;
                        current     = concrete(k(value));
                        break;
                      }
                      case IOTag.SucceedWith: {
                        extraTrace  = current.trace;
                        const value = nested.effect(this.runtimeConfig, this.fiberId);
                        extraTrace  = undefined;
                        current     = concrete(k(value));
                        break;
                      }
                      case IOTag.Yield: {
                        extraTrace = current.trace;
                        this.unsafeRunLater(concrete(IO.unit));
                        extraTrace = undefined;
                        current    = null;
                        break;
                      }
                      default: {
                        this.unsafePushStackFrame(new TracedCont(current.f, current.trace));
                        current = concrete(current.io);
                        break;
                      }
                    }
                    break;
                  }
                  case IOTag.Trace: {
                    current = this.unsafeNextEffect(
                      this.unsafeCaptureTrace(Cons(current.trace, Nil())),
                    );
                    break;
                  }
                  case IOTag.SucceedNow: {
                    current = this.unsafeNextEffect(current.value);
                    break;
                  }
                  case IOTag.Succeed: {
                    current = this.unsafeNextEffect(current.effect());
                    break;
                  }
                  case IOTag.SucceedWith: {
                    current = this.unsafeNextEffect(
                      current.effect(this.runtimeConfig, this.fiberId),
                    );
                    break;
                  }
                  case IOTag.Fail: {
                    const fastPathTrace: List<string> =
                      extraTrace === undefined ? Nil() : Cons(extraTrace, Nil());
                    extraTrace = undefined;

                    const cause       = current.cause();
                    const tracedCause = cause.isTraced
                      ? cause
                      : Cause.traced(
                          cause,
                          this.unsafeCaptureTrace(Cons(current.trace, fastPathTrace)),
                        );

                    const discardedFolds            = this.unsafeUnwindStack();
                    const strippedCause: Cause<any> = discardedFolds
                      ? // We threw away some error handlers while unwinding the stack because
                        // we got interrupted during this instruction. So it's not safe to return
                        // typed failures from cause0, because they might not be typed correctly.
                        // Instead, we strip the typed failures, and return the remainders and
                        // the interruption
                        tracedCause.stripFailures
                      : tracedCause;
                    const suppressed = this.unsafeClearSuppressedCause();
                    const fullCause  = strippedCause.contains(suppressed)
                      ? strippedCause
                      : Cause.then(strippedCause, suppressed);

                    if (this.unsafeIsStackEmpty) {
                      // Error not caught, stack is empty:
                      this.unsafeSetInterrupting(true);

                      current = this.unsafeTryDone(Exit.failCause(fullCause), current.trace);
                    } else {
                      this.unsafeSetInterrupting(false);

                      // Error caught, next continuation on the stack will deal
                      // with it, so we just have to compute it here
                      current = this.unsafeNextEffect(fullCause);
                    }
                    break;
                  }
                  case IOTag.Match: {
                    this.unsafePushStackFrame(current);
                    current = concrete(current.io);
                    break;
                  }
                  case IOTag.SetInterrupt: {
                    const boolFlag = current.flag.toBoolean;
                    if (this.unsafeIsInterruptible !== boolFlag) {
                      this.unsafePushInterruptStatus(current.flag.toBoolean);
                      this.unsafeRestoreInterruptStatus();
                    }
                    current = concrete(current.io);
                    break;
                  }
                  case IOTag.GetInterrupt: {
                    current = concrete(
                      current.f(InterruptStatus.fromBoolean(this.unsafeIsInterruptible)),
                    );
                    break;
                  }
                  case IOTag.Async: {
                    const trace = current.trace;

                    const epoch     = this.asyncEpoch;
                    this.asyncEpoch = epoch + 1;

                    this.unsafeEnterAsync(epoch, current.blockingOn, trace);

                    const r = current.register(this.unsafeCreateAsyncResume(epoch));

                    switch (r._tag) {
                      case "Left": {
                        this.unsafeSetAsyncCanceller(epoch, r.left);
                        if (this.unsafeShouldInterrupt) {
                          if (this.unsafeExitAsync(epoch)) {
                            this.unsafeSetInterrupting(true);
                            current = concrete(
                              r.left.chain(() =>
                                IO.failCauseNow(this.unsafeClearSuppressedCause()),
                              ),
                            );
                          } else {
                            current = null;
                          }
                        } else {
                          current = null;
                        }
                        break;
                      }
                      case "Right": {
                        if (!this.unsafeExitAsync(epoch)) {
                          current = null;
                        } else {
                          current = concrete(r.right);
                        }
                      }
                    }
                    break;
                  }
                  case IOTag.Fork: {
                    current = this.unsafeNextEffect(
                      this.unsafeFork(concrete(current.io), current.scope, current.trace),
                    );
                    break;
                  }
                  case IOTag.GetDescriptor: {
                    current = concrete(current.f(this.unsafeGetDescriptor()));
                    break;
                  }
                  case IOTag.Yield: {
                    current = null;
                    this.unsafeRunLater(concrete(IO.unit));
                    break;
                  }
                  case IOTag.Environment: {
                    current = concrete(current.f(this.unsafeGetRef(FiberRef.currentEnvironment)));
                    break;
                  }
                  case IOTag.Provide: {
                    const oldEnvironment = this.unsafeGetRef(FiberRef.currentEnvironment);
                    this.unsafeSetRef(FiberRef.currentEnvironment, current.env);
                    this.unsafeAddFinalizer(
                      IO.succeed(() => {
                        this.unsafeSetRef(FiberRef.currentEnvironment, oldEnvironment);
                      }),
                    );
                    current = concrete(current.io);
                    break;
                  }
                  case IOTag.Defer: {
                    current = concrete(current.make());
                    break;
                  }
                  case IOTag.DeferWith: {
                    current = concrete(current.make(this.runtimeConfig, this.fiberId));
                    break;
                  }

                  case IOTag.FiberRefGetAll: {
                    current = concrete(current.make(this.fiberRefLocals));
                    break;
                  }

                  case IOTag.FiberRefModify: {
                    const c                  = current;
                    const [result, newValue] = current.f(this.unsafeGetRef(current.fiberRef));
                    this.unsafeSetRef(c.fiberRef, newValue);
                    current = this.unsafeNextEffect(result);
                    break;
                  }

                  case IOTag.FiberRefLocally: {
                    const oldValue = this.unsafeGetRef(current.fiberRef);
                    const fiberRef = current.fiberRef;
                    this.unsafeSetRef(fiberRef, current.localValue);
                    this.unsafeAddFinalizer(
                      IO.succeed(() => {
                        this.unsafeSetRef(fiberRef, oldValue);
                      }),
                    );
                    current = concrete(current.io);
                    break;
                  }

                  case IOTag.FiberRefDelete: {
                    this.unsafeDeleteRef(current.fiberRef);
                    current = this.unsafeNextEffect(undefined);
                    break;
                  }

                  case IOTag.FiberRefWith: {
                    current = concrete(current.f(this.unsafeGetRef(current.fiberRef)));
                    break;
                  }

                  case IOTag.GetRuntimeConfig: {
                    current = concrete(current.f(this.runtimeConfig));
                    break;
                  }

                  case IOTag.Race: {
                    current = concrete(this.unsafeRace(current));
                    break;
                  }

                  case IOTag.Supervise: {
                    const oldSupervisor    = this.currentSupervisor;
                    this.currentSupervisor = current.supervisor.zip(oldSupervisor);
                    this.unsafeAddFinalizer(
                      IO.succeed(() => {
                        this.currentSupervisor = oldSupervisor;
                      }),
                    );
                    current = concrete(current.io);
                    break;
                  }

                  case IOTag.GetForkScope: {
                    current = concrete(
                      current.f(
                        this.unsafeGetRef(FiberRef.forkScopeOverride).getOrElse(this.scope),
                      ),
                    );
                    break;
                  }

                  case IOTag.OverrideForkScope: {
                    const oldForkScopeOverride = this.unsafeGetRef(FiberRef.forkScopeOverride);
                    this.unsafeSetRef(FiberRef.forkScopeOverride, current.forkScope);
                    this.unsafeAddFinalizer(
                      IO.succeed(() => {
                        this.unsafeSetRef(FiberRef.forkScopeOverride, oldForkScopeOverride);
                      }),
                    );
                    current = concrete(current.io);
                    break;
                  }
                  case IOTag.Ensuring: {
                    this.unsafeAddFinalizer(current.finalizer);
                    current = concrete(current.io);
                    break;
                  }
                  case IOTag.Logged: {
                    this.unsafeLogWith(
                      current.message,
                      current.cause,
                      current.overrideLogLevel,
                      current.overrideRef1,
                      current.overrideValue1,
                      current.trace,
                    );

                    current = this.unsafeNextEffect(undefined);
                    break;
                  }
                  case IOTag.SetRuntimeConfig: {
                    this.runtimeConfig = current.runtimeConfig;
                    current            = concrete(IO.unit);
                    break;
                  }
                  default: {
                    console.log("Unrecognized Instruction", current);
                    throw new Error("Unrecognized Instruction");
                  }
                }
              }
            } else {
              const trace = current.trace;

              current = concrete(IO.failCauseNow(this.unsafeClearSuppressedCause(), trace));
              this.unsafeSetInterrupting(true);
            }
            opCount++;
          }
        } catch (e) {
          if (isInterruptedException(e)) {
            const trace = current ? current.trace : undefined;
            current     = concrete(IO.interruptAs(FiberId.none, trace));
            this.unsafeSetInterrupting(true);
          } else if (isIOError(e)) {
            switch (e.exit._tag) {
              case "Success": {
                current = this.unsafeNextEffect(e.exit.value);
                break;
              }
              case "Failure": {
                const trace = current ? current.trace : undefined;
                current     = concrete(IO.failCauseNow(e.exit.cause, trace));
              }
            }
          } else {
            this.unsafeSetInterrupting(true);
            current = concrete(IO.haltNow(e));
          }
        }
      }
    } finally {
      currentFiber.set(null);
      this.currentSupervisor !== Supervisor.none && this.currentSupervisor.unsafeOnSuspend(this);
    }
  }

  unsafeRunLater(i0: Instruction) {
    defaultScheduler(() => {
      this.nextIO = i0;
      this.runUntil(this.runtimeConfig.yieldOpCount);
    });
  }

  private unsafeGetRef<A>(ref: FiberRef.Runtime<A>): A {
    return (this.fiberRefLocals.get(ref) as A) || ref.initial;
  }

  private unsafeSetRef<A>(ref: FiberRef.Runtime<A>, value: A): void {
    this.fiberRefLocals.set(ref, value);
  }

  private unsafeDeleteRef<A>(ref: FiberRef.Runtime<A>): void {
    this.fiberRefLocals.delete(ref);
  }

  private unsafePoll() {
    switch (this.state._tag) {
      case "Executing": {
        return Nothing();
      }
      case "Done": {
        return Just(this.state.value);
      }
    }
  }

  private interruptExit = new InterruptExit((v: any) => {
    if (this.unsafeIsInterruptible) {
      this.unsafePopInterruptStatus();
      return IO.succeedNow(v);
    } else {
      return IO.succeed(() => {
        this.unsafePopInterruptStatus();
        return v;
      });
    }
  });

  private unsafeAddFinalizer(finalizer: UIO<any>): void {
    this.unsafePushStackFrame(
      new Finalizer(finalizer, (v) => {
        this.unsafeDisableInterruption();
        this.unsafeRestoreInterruptStatus();
        return finalizer.map(() => v);
      }),
    );
  }

  private get unsafeIsInterruptible() {
    return this.interruptStatus ? this.interruptStatus.value : true;
  }

  private get unsafeIsInterrupted() {
    return this.state.interruptors.size > 0;
  }

  private get unsafeIsInterrupting() {
    return this.state.status.isInterrupting;
  }

  private get unsafeShouldInterrupt() {
    return this.unsafeIsInterrupted && this.unsafeIsInterruptible && !this.unsafeIsInterrupting;
  }

  private get unsafeIsStackEmpty() {
    return !this.stack;
  }

  private unsafePushStackFrame(k: Frame) {
    this.stack = Stack.make(k, this.stack);
  }

  private unsafePopStackFrame() {
    const current = this.stack?.value;
    this.stack    = this.stack?.previous;
    return current;
  }

  private unsafeDisableInterruption(): void {
    this.unsafePushInterruptStatus(false);
  }

  private unsafeRestoreInterruptStatus(): void {
    this.unsafePushStackFrame(this.interruptExit);
  }

  private unsafePushInterruptStatus(flag: boolean) {
    this.interruptStatus = Stack.make(flag, this.interruptStatus);
  }

  private unsafePopInterruptStatus() {
    const current        = this.interruptStatus?.value;
    this.interruptStatus = this.interruptStatus?.previous;
    return current;
  }

  private unsafeAddSuppressedCause(cause: Cause<never>): void {
    if (!cause.isEmpty) {
      if (this.state._tag === "Executing") {
        this.state.suppressed = Cause.then(this.state.suppressed, cause);
      }
    }
  }

  /**
   * Unwinds the stack, looking for the first error handler, and exiting
   * interruptible / uninterruptible regions.
   */
  private unsafeUnwindStack() {
    let unwinding      = true;
    let discardedFolds = false;

    // Unwind the stack, looking for an error handler:
    while (unwinding && !this.unsafeIsStackEmpty) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const frame = this.unsafePopStackFrame()!;

      switch (frame._tag) {
        case "InterruptExit": {
          this.unsafePopInterruptStatus();
          break;
        }
        case "Finalizer": {
          this.unsafeDisableInterruption();
          this.unsafePushStackFrame(
            new TracedCont(
              (cause) =>
                frame.finalizer.matchCauseIO(
                  (finalizerCause) => {
                    this.unsafePopInterruptStatus();
                    this.unsafeAddSuppressedCause(finalizerCause);
                    return IO.failCauseNow(cause);
                  },
                  () => {
                    this.unsafePopInterruptStatus();
                    return IO.failCauseNow(cause);
                  },
                ),
              frame.trace,
            ),
          );
          unwinding = false;
          break;
        }
        case IOTag.Match: {
          if (!this.unsafeShouldInterrupt) {
            // Push error handler back onto the stack and halt iteration:
            this.unsafePushStackFrame(new HandlerFrame(frame.onFailure, frame.trace));
            unwinding = false;
          } else {
            discardedFolds = true;
          }
          break;
        }
      }
    }

    return discardedFolds;
  }

  private unsafeAddObserver(k: FiberState.Callback<never, Exit<E, A>>): Exit<E, A> | null {
    switch (this.state._tag) {
      case "Done": {
        return this.state.value;
      }
      case "Executing": {
        this.state.observers.add(k);
        return null;
      }
    }
  }

  private unsafeNextEffect(value: any): Instruction | null {
    if (!this.unsafeIsStackEmpty) {
      const k = this.unsafePopStackFrame()!;
      return concrete(k.apply(value));
    } else {
      return this.unsafeTryDone(Exit.succeed(value));
    }
  }

  private unsafeNotifyObservers(
    v: Exit<E, A>,
    observers: Set<FiberState.Callback<never, Exit<E, A>>>,
  ) {
    if (observers.size > 0) {
      const result = Exit.succeed(v);
      observers.forEach((k) => k(result));
    }
  }

  private unsafeRemoveObserver(k: FiberState.Callback<never, Exit<E, A>>) {
    if (this.state._tag === "Executing") {
      this.state.observers.delete(k);
    }
  }

  private unsafeInterruptAs(fiberId: FiberId): UIO<Exit<E, A>> {
    const interruptedCause = Cause.interrupt(fiberId);
    return IO.defer(() => {
      const oldState = this.state;
      if (
        this.state._tag === "Executing" &&
        this.state.status._tag === "Suspended" &&
        this.state.status.interruptible &&
        this.state.asyncCanceller._tag === "Registered"
      ) {
        const asyncCanceller      = this.state.asyncCanceller.asyncCanceller;
        const interrupt           = IO.failCauseNow(interruptedCause);
        this.state.status         = FiberStatus.running(true);
        this.state.interruptors   = new Set(oldState.interruptors).add(fiberId);
        this.state.asyncCanceller = CancellerState.empty;
        this.unsafeRunLater(concrete(asyncCanceller.chain(() => interrupt)));
      } else if (this.state._tag === "Executing") {
        const newCause = Cause.then(this.state.suppressed, interruptedCause);
        this.state.interruptors.add(fiberId);
        this.state.suppressed = newCause;
      }
      return this.await;
    });
  }

  private unsafeTryDone(exit: Exit<E, A>, trace?: string): Instruction | null {
    switch (this.state._tag) {
      case "Done": {
        // Already done
        return null;
      }
      case "Executing": {
        if (this.state.mailbox !== null) {
          // Not done because the mailbox isn't empty
          const mailbox      = this.state.mailbox;
          this.state.mailbox = null;
          this.unsafeSetInterrupting(true);
          return concrete(mailbox.chain(() => IO.fromExit(exit)));
        } else if (this.children.size === 0) {
          // We are truly "done" because all the children of this fiber have terminated,
          // and there are no more pending effects that we have to execute on the fiber.
          const interruptorsCause = this.state.interruptorsCause;

          const newExit = interruptorsCause.isEmpty
            ? exit
            : exit.mapErrorCause((cause) => {
                if (cause.contains(interruptorsCause)) {
                  return cause;
                } else {
                  return Cause.then(cause, interruptorsCause);
                }
              });

          const observers = this.state.observers;

          this.state = FiberState.done(newExit);

          this.unsafeReportUnhandled(newExit);

          this.unsafeNotifyObservers(newExit, observers);

          return null;
        } else {
          // not done because there are children left to close
          this.unsafeSetInterrupting(true);

          let interruptChildren = IO.unit;

          this.children.forEach((child) => {
            interruptChildren = interruptChildren.chain(() => child.interruptAs(this.fiberId));
          });
          this.children.clear();

          return concrete(interruptChildren.chain(() => IO.fromExit(exit)));
        }
      }
    }
  }

  private unsafeSetAsyncCanceller(epoch: number, asyncCanceller0: Erased | null): void {
    const asyncCanceller = !asyncCanceller0 ? IO.unit : asyncCanceller0;
    if (this.state._tag === "Executing") {
      if (
        this.state.status._tag === "Suspended" &&
        this.state.asyncCanceller._tag === "Pending" &&
        this.state.status.epoch === epoch
      ) {
        this.state.asyncCanceller = CancellerState.registered(asyncCanceller);
      } else if (
        this.state.status._tag === "Suspended" &&
        this.state.asyncCanceller._tag === "Registered" &&
        this.state.status.epoch === epoch
      ) {
        throw new Error("inconsistent state in setAsyncCanceller");
      }
    } else {
      return;
    }
  }

  private unsafeReportUnhandled(exit: Exit<E, A>, trace?: string): void {
    if (exit._tag === ExitTag.Failure) {
      this.runtimeConfig.reportFailure(exit.cause);
    }
  }

  private unsafeSetInterrupting(value: boolean): void {
    switch (this.state._tag) {
      case "Executing": {
        this.state.status = this.state.status.withInterrupting(value);
        return;
      }
      case "Done": {
        return;
      }
    }
  }

  private unsafeEnterAsync(epoch: number, blockingOn: FiberId, trace?: string): void {
    if (
      this.state._tag === "Executing" &&
      this.state.status._tag === FiberStatusTag.Running &&
      this.state.asyncCanceller._tag === "Empty"
    ) {
      const newStatus = FiberStatus.suspended(
        this.state.status.interrupting,
        this.unsafeIsInterruptible && !this.unsafeIsInterrupting,
        epoch,
        blockingOn,
        trace,
      );
      this.state.status         = newStatus;
      this.state.asyncCanceller = CancellerState.pending;
    } else {
      throw new IllegalStateError(`Fiber ${this.fiberId.threadName} is not running`);
    }
  }

  private unsafeExitAsync(epoch: number): boolean {
    if (
      this.state._tag === "Executing" &&
      this.state.status._tag === "Suspended" &&
      this.state.status.epoch === epoch
    ) {
      this.state.status         = FiberStatus.running(this.state.status.interrupting);
      this.state.asyncCanceller = CancellerState.empty;
      return true;
    }
    return false;
  }

  private unsafeCreateAsyncResume(epoch: number) {
    return (_: Erased) => {
      if (this.unsafeExitAsync(epoch)) {
        this.unsafeRunLater(concrete(_));
      }
    };
  }

  private unsafeFork(
    io: Instruction,
    forkScope: Maybe<FiberScope>,
    trace?: string,
  ): FiberContext<any, any> {
    const childFiberRefLocals: FiberRefLocals = new Map();

    this.fiberRefLocals.forEach((v, k) => {
      childFiberRefLocals.set(k, k.fork(v));
    });

    const parentScope: FiberScope = forkScope
      .orElse(this.unsafeGetRef(FiberRef.forkScopeOverride))
      .getOrElse(this.scope);

    const childId       = FiberId.newFiberId();
    const grandChildren = new Set<FiberContext<any, any>>();

    const childContext = new FiberContext<any, any>(
      childId,
      this.runtimeConfig,
      Stack.make(this.unsafeIsInterruptible),
      childFiberRefLocals,
      grandChildren,
      trace,
    );

    if (this.currentSupervisor !== Supervisor.none) {
      this.currentSupervisor.unsafeOnStart(
        this.unsafeGetRef(FiberRef.currentEnvironment),
        io,
        Just(this),
        childContext,
      );
      childContext.unsafeOnDone((exit) => {
        this.currentSupervisor.unsafeOnEnd(exit.flatten, childContext);
      });
    }

    const childIO = !parentScope.unsafeAdd(childContext) ? IO.interruptAs(parentScope.fiberId) : io;

    childContext.nextIO = concrete(childIO);
    defaultScheduler(() => childContext.runUntil(this.runtimeConfig.yieldOpCount));

    return childContext;
  }

  unsafeOnDone(k: FiberState.Callback<never, Exit<E, A>>): void {
    const exit = this.unsafeAddObserver(k);
    if (exit == null) {
      return;
    } else {
      k(Exit.succeed(exit));
    }
  }

  private unsafeClearSuppressedCause(): Cause<never> {
    switch (this.state._tag) {
      case "Executing": {
        const suppressed      = this.state.suppressed;
        this.state.suppressed = Cause.empty();
        return suppressed;
      }
      case "Done": {
        return Cause.empty();
      }
    }
  }

  private unsafeGetDescriptor() {
    return new FiberDescriptor(
      this.fiberId,
      this.state.status,
      this.state.interruptors,
      InterruptStatus.fromBoolean(this.unsafeIsInterruptible),
      this.scope,
    );
  }

  private unsafeRace<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3>(
    race: Race<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3>,
  ): IO<R & R1 & R2 & R3, E2 | E3, A2 | A3> {
    const raceIndicator = new AtomicReference(true);
    const left          = this.unsafeFork(concrete(race.left), race.scope, race.trace);
    const right         = this.unsafeFork(concrete(race.right), race.scope, race.trace);

    return IO.async<R & R1 & R2 & R3, E2 | E3, A2 | A3>((cb) => {
      const leftRegister = left.unsafeAddObserver((exit) => {
        exit.match(
          () => this.unsafeCompleteRace(left, right, race.leftWins, exit, raceIndicator, cb),
          (v) => this.unsafeCompleteRace(left, right, race.leftWins, v, raceIndicator, cb),
        );
      });
      if (leftRegister != null) {
        this.unsafeCompleteRace(left, right, race.leftWins, leftRegister, raceIndicator, cb);
      } else {
        const rightRegister = right.unsafeAddObserver((exit) => {
          exit.match(
            () => this.unsafeCompleteRace(right, left, race.rightWins, exit, raceIndicator, cb),
            (v) => this.unsafeCompleteRace(right, left, race.rightWins, v, raceIndicator, cb),
          );
        });
        if (rightRegister != null) {
          this.unsafeCompleteRace(right, left, race.rightWins, rightRegister, raceIndicator, cb);
        }
      }
    }, left.fiberId.combine(right.fiberId));
  }

  private unsafeCompleteRace<R, R1, R2, E2, A2, R3, E3, A3>(
    winner: Fiber<any, any>,
    loser: Fiber<any, any>,
    cont: (exit: Exit<any, any>, fiber: Fiber<any, any>) => Erased,
    winnerExit: Exit<any, any>,
    ab: AtomicReference<boolean>,
    cb: (_: IO<R & R1 & R2 & R3, E2 | E3, A2 | A3>) => void,
  ): void {
    if (ab.compareAndSet(true, false)) {
      winnerExit.match(
        () => cb(cont(winnerExit, loser)),
        () => cb(winner.inheritRefs.chain(() => cont(winnerExit, loser))),
      );
    }
  }

  private unsafeCaptureTrace(prefix: List<string | undefined>): Trace {
    const builder = new StackTraceBuilder();

    prefix.forEach((element) => builder.append(TraceElement.parse(element)));

    let stack = this.stack;
    while (stack != null) {
      builder.append(TraceElement.parse(stack.value.trace));
      stack = stack.previous;
    }

    return new Trace(this.fiberId, builder.result());
  }

  private unsafeEvalOn(effect: UIO<any>, orElse: UIO<any>): UIO<void> {
    if (this.state._tag === "Executing") {
      const newMailbox =
        this.state.mailbox == null ? effect : this.state.mailbox.chain(() => effect);
      this.state.mailbox = newMailbox;
      return IO.unit;
    } else {
      return orElse.asUnit;
    }
  }

  private unsafeDrainMailbox(): UIO<any> | null {
    if (this.state._tag === "Executing") {
      const mailbox      = this.state.mailbox;
      this.state.mailbox = null;
      return mailbox;
    } else {
      return null;
    }
  }

  unsafeAddChild(child: FiberContext<unknown, unknown>): void {
    this.unsafeEvalOn(
      IO.succeed(() => {
        this.children.add(child);
      }),
      IO.unit,
    );
  }

  private unsafeLog(message: () => string, trace?: string): void {
    const logLevel    = this.unsafeGetRef(FiberRef.currentLogLevel);
    const spans       = this.unsafeGetRef(FiberRef.currentLogSpan);
    const annotations = this.unsafeGetRef(FiberRef.currentLogAnnotations);
    this.runtimeConfig.logger.log(
      TraceElement.parse(trace),
      this.fiberId,
      logLevel,
      message,
      Cause.empty(),
      this.fiberRefLocals,
      spans,
      annotations,
    );
  }

  private unsafeLogWith(
    message: () => string,
    cause: Cause<any>,
    overrideLogLevel: Maybe<LogLevel>,
    overrideRef1: FiberRef.Runtime<unknown> | null = null,
    overrideValue1: unknown | null = null,
    trace?: string,
  ): void {
    const logLevel = overrideLogLevel.getOrElse(this.unsafeGetRef(FiberRef.currentLogLevel));

    const spans = this.unsafeGetRef(FiberRef.currentLogSpan);

    const annotations = this.unsafeGetRef(FiberRef.currentLogAnnotations);

    let contextMap: FiberRefLocals;

    if (overrideRef1 !== null) {
      const map = new Map(this.fiberRefLocals);
      if (overrideValue1 === null) {
        map.delete(overrideRef1);
      } else {
        map.set(overrideRef1, overrideValue1);
      }
      contextMap = map;
    } else {
      contextMap = new Map(this.fiberRefLocals);
    }

    this.runtimeConfig.logger.log(
      TraceElement.parse(trace),
      this.fiberId,
      logLevel,
      message,
      cause,
      contextMap,
      spans,
      annotations,
    );
  }
}
