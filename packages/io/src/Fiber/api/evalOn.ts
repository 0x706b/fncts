/**
 * @tsplus pipeable fncts.io.Fiber evalOn
 */
export function evalOn(effect: UIO<any>, orElse: UIO<any>, __tsplusTrace?: string) {
  return <E, A>(fiber: Fiber<E, A>): UIO<void> => {
    fiber.concrete();
    switch (fiber._tag) {
      case "RuntimeFiber":
        return fiber.evalOn(effect, orElse);
      case "SyntheticFiber":
        return IO.unit;
    }
  };
}
