/**
 * @tsplus fluent fncts.io.Fiber evalOn
 */
export function evalOn_<E, A>(
  fiber: Fiber<E, A>,
  effect: UIO<any>,
  orElse: UIO<any>,
  __tsplusTrace?: string,
): UIO<void> {
  fiber.concrete();
  switch (fiber._tag) {
    case "RuntimeFiber":
      return fiber.evalOn(effect, orElse);
    case "SyntheticFiber":
      return IO.unit;
  }
}
