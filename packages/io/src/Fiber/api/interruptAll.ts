/**
 * Interrupts all fibers as by the specified fiber, awaiting their interruption.
 *
 * @tsplus static fncts.io.FiberOps interruptAllAs
 */
export function interruptAllAs(fs: Iterable<Fiber<any, any>>, id: FiberId, __tsplusTrace?: string): UIO<void> {
  return IO.foreachDiscard(fs, (fiber) => fiber.interruptAsFork(id)) > IO.foreachDiscard(fs, (fiber) => fiber.await);
}
/**
 * Interrupts all fibers and awaits their interruption
 *
 * @tsplus static fncts.io.FiberOps interruptAll
 */
export function interruptAll(fs: Iterable<Fiber<any, any>>, __tsplusTrace?: string): UIO<void> {
  return IO.fiberId.flatMap((id) => Fiber.interruptAllAs(fs, id));
}
