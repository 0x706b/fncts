import { SyntheticFiber } from "@fncts/io/Fiber/definition";

/**
 * Effectfully maps over the value the fiber computes.
 *
 * @tsplus pipeable fncts.io.Fiber mapIO
 */
export function mapIO<E1, A, B>(f: (a: A) => FIO<E1, B>, __tsplusTrace?: string) {
  return <E>(fiber: Fiber<E, A>): Fiber<E | E1, B> => {
    return new SyntheticFiber(
      fiber.id,
      fiber.await.flatMap((_) => _.foreachIO(f)),
      fiber.children,
      fiber.inheritRefs,
      fiber.poll.flatMap((_) =>
        _.match(
          () => IO.succeedNow(Nothing()),
          (_) => _.foreachIO(f).map((exit) => Just(exit)),
        ),
      ),
      (id) => fiber.interruptAs(id).flatMap((_) => _.foreachIO(f)),
    );
  };
}

/**
 * Maps over the value the fiber computes.
 *
 * @tsplus pipeable fncts.io.Fiber map
 */
export function map<A, B>(f: (a: A) => B, __tsplusTrace?: string) {
  return <E>(fa: Fiber<E, A>): Fiber<E, B> => {
    return fa.mapIO((a) => IO.succeedNow(f(a)));
  };
}
