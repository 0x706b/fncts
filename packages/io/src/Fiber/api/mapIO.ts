import { SyntheticFiber } from "@fncts/io/Fiber/definition";

/**
 * Effectfully maps over the value the fiber computes.
 *
 * @tsplus fluent fncts.io.Fiber mapIO
 */
export function mapIO_<E, E1, A, B>(fiber: Fiber<E, A>, f: (a: A) => FIO<E1, B>): Fiber<E | E1, B> {
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
}

/**
 * Maps over the value the fiber computes.
 *
 * @tsplus fluent fncts.io.Fiber map
 */
export function map_<E, A, B>(fa: Fiber<E, A>, f: (a: A) => B): Fiber<E, B> {
  return fa.mapIO((a) => IO.succeedNow(f(a)));
}
