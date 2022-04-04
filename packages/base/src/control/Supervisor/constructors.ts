import type { AtomicReference } from "../../internal/AtomicReference.js";

import { ConstSupervisor } from "./definition.js";

/**
 * @tsplus static fncts.control.SupervisorOps unsafeTrack
 */
export function unsafeTrack(): Supervisor<Conc<Fiber.Runtime<any, any>>> {
  const set = new Set<Fiber.Runtime<any, any>>();
  return new (class extends Supervisor<Conc<Fiber.Runtime<any, any>>> {
    value = IO.succeed(Conc.from(set));
    unsafeOnStart<R, E, A>(
      _environment: R,
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
 * @tsplus static fncts.control.SupervisorOps fibersIn
 */
export function fibersIn(
  ref: AtomicReference<HashSet<Fiber.Runtime<any, any>>>,
): UIO<Supervisor<HashSet<Fiber.Runtime<any, any>>>> {
  return IO.succeed(
    new (class extends Supervisor<HashSet<Fiber.Runtime<any, any>>> {
      value = IO.succeed(ref.get);
      unsafeOnStart<R, E, A>(
        _environment: R,
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
 * @tsplus static fncts.control.SupervisorOps fromIO
 */
export function fromIO<A>(ma: UIO<A>): Supervisor<A> {
  return new ConstSupervisor(ma);
}

/**
 * @tsplus static fncts.control.SupervisorOps none
 */
export const none = new ConstSupervisor(IO.unit);

/**
 * @tsplus static fncts.control.SupervisorOps track
 */
export const track: UIO<Supervisor<Conc<Fiber.Runtime<any, any>>>> = IO.succeed(unsafeTrack());
