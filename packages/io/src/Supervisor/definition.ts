import type { SupervisorPatch } from "@fncts/io/SupervisorPatch";
export const enum SupervisorTag {
  Const,
  Proxy,
  Zip,
}

/**
 * @tsplus type fncts.io.Supervisor
 * @tsplus companion fncts.io.SupervisorOps
 */
export abstract class Supervisor<A> {
  abstract readonly value: UIO<A>;
  abstract unsafeOnStart<R, E, A>(
    environment: Environment<R>,
    effect: IO<R, E, A>,
    parent: Maybe<Fiber.Runtime<E, A>>,
    fiber: Fiber.Runtime<E, A>,
  ): void;
  abstract unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: Fiber.Runtime<E, A>): void;
  unsafeOnEffect<E, A>(_fiber: Fiber.Runtime<E, A>, _effect: IO<any, any, any>): void {
    return;
  }
  unsafeOnSuspend<E, A>(_fiber: Fiber.Runtime<E, A>): void {
    return;
  }
  unsafeOnResume<E, A>(_fiber: Fiber.Runtime<E, A>): void {
    return;
  }
}

export declare namespace Supervisor {
  type Patch = SupervisorPatch;
}

export class ConstSupervisor<A> extends Supervisor<A> {
  readonly _tag = SupervisorTag.Const;
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
  readonly _tag = SupervisorTag.Proxy;
  constructor(readonly value: UIO<A>, readonly underlying: Supervisor<any>) {
    super();
  }
  unsafeOnStart<R, E, A>(
    environment: Environment<R>,
    effect: IO<R, E, A>,
    parent: Maybe<Fiber.Runtime<E, A>>,
    fiber: Fiber.Runtime<E, A>,
  ): void {
    this.underlying.unsafeOnStart(environment, effect, parent, fiber);
  }
  unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: Fiber.Runtime<E, A>): void {
    this.underlying.unsafeOnEnd(value, fiber);
  }
  unsafeOnEffect<E, A>(fiber: Fiber.Runtime<E, A>, effect: IO<any, any, any>): void {
    this.underlying.unsafeOnEffect(fiber, effect);
  }
  unsafeOnSuspend<E, A>(fiber: Fiber.Runtime<E, A>) {
    this.underlying.unsafeOnSuspend(fiber);
  }
  unsafeOnResume<E, A>(fiber: Fiber.Runtime<E, A>) {
    this.underlying.unsafeOnResume(fiber);
  }
}

export class Zip<A, B> extends Supervisor<readonly [A, B]> {
  readonly _tag = SupervisorTag.Zip;
  constructor(readonly first: Supervisor<A>, readonly second: Supervisor<B>) {
    super();
  }
  value = this.first.value.zip(this.second.value);
  unsafeOnStart<R, E, A>(
    environment: Environment<R>,
    effect: IO<R, E, A>,
    parent: Maybe<Fiber.Runtime<any, any>>,
    fiber: Fiber.Runtime<E, A>,
  ) {
    try {
      this.first.unsafeOnStart(environment, effect, parent, fiber);
    } finally {
      this.second.unsafeOnStart(environment, effect, parent, fiber);
    }
  }
  unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: Fiber.Runtime<E, A>) {
    this.first.unsafeOnEnd(value, fiber);
    this.second.unsafeOnEnd(value, fiber);
  }
  unsafeOnEffect<E, A>(fiber: Fiber.Runtime<E, A>, effect: IO<any, any, any>) {
    this.first.unsafeOnEffect(fiber, effect);
    this.second.unsafeOnEffect(fiber, effect);
  }
  unsafeOnSuspend<E, A>(fiber: Fiber.Runtime<E, A>) {
    this.first.unsafeOnSuspend(fiber);
    this.second.unsafeOnSuspend(fiber);
  }
  unsafeOnResume<E, A>(fiber: Fiber.Runtime<E, A>) {
    this.first.unsafeOnResume(fiber);
    this.second.unsafeOnResume(fiber);
  }
}

export type Concrete = ConstSupervisor<any> | ProxySupervisor<any> | Zip<any, any>;

/**
 * @tsplus macro remove
 */
export function concrete(_: Supervisor<any>): asserts _ is Concrete {
  //
}
