import type { HashSet } from "../../collection/immutable/HashSet";
import type { Exit } from "../../data/Exit";
import type { Maybe } from "../../data/Maybe";
import type { AtomicReference } from "../../internal/AtomicReference";
import type { RuntimeFiber } from "../Fiber";
import type { UIO } from "../IO";

import { Conc } from "../../collection/immutable/Conc";
import { IO } from "../IO";
import { ConstSupervisor, Supervisor } from "./definition";

/**
 * @tsplus static fncts.control.SupervisorOps unsafeTrace
 */
export function unsafeTrack(): Supervisor<Conc<RuntimeFiber<any, any>>> {
  const set = new Set<RuntimeFiber<any, any>>();
  return new (class extends Supervisor<Conc<RuntimeFiber<any, any>>> {
    value = IO.succeed(Conc.from(set));
    unsafeOnStart<R, E, A>(
      _environment: R,
      _effect: IO<R, E, A>,
      _parent: Maybe<RuntimeFiber<E, A>>,
      fiber: RuntimeFiber<E, A>,
    ) {
      set.add(fiber);
    }
    unsafeOnEnd<E, A>(_value: Exit<E, A>, fiber: RuntimeFiber<E, A>) {
      set.delete(fiber);
    }
  })();
}

/**
 * @tsplus static fncts.control.SupervisorOps fibersIn
 */
export function fibersIn(
  ref: AtomicReference<HashSet<RuntimeFiber<any, any>>>,
): UIO<Supervisor<HashSet<RuntimeFiber<any, any>>>> {
  return IO.succeed(
    new (class extends Supervisor<HashSet<RuntimeFiber<any, any>>> {
      value = IO.succeed(ref.get);
      unsafeOnStart<R, E, A>(
        _environment: R,
        _effect: IO<R, E, A>,
        _parent: Maybe<RuntimeFiber<any, any>>,
        fiber: RuntimeFiber<E, A>,
      ) {
        ref.set(ref.get.add(fiber));
      }
      unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: RuntimeFiber<E, A>) {
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
export const track: UIO<Supervisor<Conc<RuntimeFiber<any, any>>>> = IO.succeed(unsafeTrack());
