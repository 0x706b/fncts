import { matchTag_ } from "@fncts/base/util/pattern";

/**
 * @tsplus fluent fncts.control.Fiber evalOn
 */
export function evalOn_<E, A>(fiber: Fiber<E, A>, effect: UIO<any>, orElse: UIO<any>): UIO<void> {
  return matchTag_(fiber, {
    RuntimeFiber: (f) => f.evalOn(effect, orElse),
    SyntheticFiber: () => IO.unit,
  });
}
