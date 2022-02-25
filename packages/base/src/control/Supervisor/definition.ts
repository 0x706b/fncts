import type { Exit } from "../../data/Exit";
import type { Maybe } from "../../data/Maybe";
import type { RuntimeFiber } from "../Fiber";
import type { IO, UIO } from "../IO";

/**
 * @tsplus type fncts.control.Supervisor
 * @tsplus companion fncts.control.SupervisorOps
 */
export abstract class Supervisor<A> {
  abstract readonly value: UIO<A>;
  abstract unsafeOnStart<R, E, A>(environment: R, effect: IO<R, E, A>, parent: Maybe<RuntimeFiber<E, A>>, fiber: RuntimeFiber<E, A>): void;
  abstract unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: RuntimeFiber<E, A>): void;
  unsafeOnEffect<E, A>(_fiber: RuntimeFiber<E, A>, _effect: IO<any, any, any>): void {
    return;
  }
  unsafeOnSuspend<E, A>(_fiber: RuntimeFiber<E, A>): void {
    return;
  }
  unsafeOnResume<E, A>(_fiber: RuntimeFiber<E, A>): void {
    return;
  }
}

export class ConstSupervisor<A> extends Supervisor<A> {
  constructor(readonly value: UIO<A>) {
    super();
  }
  unsafeOnStart() {
    return;
  }
  unsafeOnEnd() {
    return;
  }
  unsafeOnEffect() {
    return;
  }
  unsafeOnSuspend() {
    return;
  }
  unsafeOnResume() {
    return;
  }
}

export class ProxySupervisor<A> extends Supervisor<A> {
  constructor(readonly value: UIO<A>, readonly underlying: Supervisor<any>) {
    super();
  }
  unsafeOnStart<R, E, A>(environment: R, effect: IO<R, E, A>, parent: Maybe<RuntimeFiber<E, A>>, fiber: RuntimeFiber<E, A>): void {
    this.underlying.unsafeOnStart(environment, effect, parent, fiber);
  }
  unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: RuntimeFiber<E, A>): void {
    this.underlying.unsafeOnEnd(value, fiber);
  }
  unsafeOnEffect<E, A>(fiber: RuntimeFiber<E, A>, effect: IO<any, any, any>): void {
    this.underlying.unsafeOnEffect(fiber, effect);
  }
  unsafeOnSuspend<E, A>(fiber: RuntimeFiber<E, A>) {
    this.underlying.unsafeOnSuspend(fiber);
  }
  unsafeOnResume<E, A>(fiber: RuntimeFiber<E, A>) {
    this.underlying.unsafeOnResume(fiber);
  }
}
