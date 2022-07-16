import type { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { IterableWeakSet } from "@fncts/base/collection/weak/IterableWeakSet";

import { ConstSupervisor } from "./definition.js";

/**
 * @tsplus static fncts.io.SupervisorOps unsafeTrack
 */
export function unsafeTrack(weak: boolean): Supervisor<Conc<Fiber.Runtime<any, any>>> {
  const set = weak ? new IterableWeakSet<Fiber.Runtime<any, any>>() : new Set<Fiber.Runtime<any, any>>();
  return new (class extends Supervisor<Conc<Fiber.Runtime<any, any>>> {
    value = IO.succeed(Conc.from(set));
    unsafeOnStart<R, E, A>(
      _environment: Environment<R>,
      _effect: IO<R, E, A>,
      _parent: Maybe<Fiber.Runtime<E, A>>,
      fiber: Fiber.Runtime<E, A>,
    ) {
      set.add(fiber);
    }
    unsafeOnEnd<E, A>(_value: Exit<E, A>, fiber: Fiber.Runtime<E, A>) {
      set.delete(fiber);
    }
  })();
}

/**
 * @tsplus static fncts.io.SupervisorOps fibersIn
 */
export function fibersIn(
  ref: AtomicReference<HashSet<Fiber.Runtime<any, any>>>,
): UIO<Supervisor<HashSet<Fiber.Runtime<any, any>>>> {
  return IO.succeed(
    new (class extends Supervisor<HashSet<Fiber.Runtime<any, any>>> {
      value = IO.succeed(ref.get);
      unsafeOnStart<R, E, A>(
        _environment: Environment<R>,
        _effect: IO<R, E, A>,
        _parent: Maybe<Fiber.Runtime<any, any>>,
        fiber: Fiber.Runtime<E, A>,
      ) {
        ref.set(ref.get.add(fiber));
      }
      unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: Fiber.Runtime<E, A>) {
        ref.set(ref.get.remove(fiber));
      }
    })(),
  );
}

/**
 * @tsplus static fncts.io.SupervisorOps fromIO
 */
export function fromIO<A>(ma: UIO<A>): Supervisor<A> {
  return new ConstSupervisor(ma);
}

/**
 * @tsplus static fncts.io.SupervisorOps none
 */
export const none = new ConstSupervisor(IO.unit);

/**
 * @tsplus static fncts.io.SupervisorOps track
 */
export function track(weak: boolean, __tsplusTrace?: string): UIO<Supervisor<Conc<Fiber.Runtime<any, any>>>> {
  return IO.succeed(unsafeTrack(weak));
}
