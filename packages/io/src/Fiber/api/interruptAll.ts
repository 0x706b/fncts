/**
 * Interrupts all fibers as by the specified fiber, awaiting their interruption.
 *
 * @tsplus static fncts.io.FiberOps interruptAllAs
 */
export function interruptAllAs_(fs: Iterable<Fiber<any, any>>, id: FiberId, __tsplusTrace?: string): UIO<void> {
  return fs.foldLeft(IO.unit, (io, f) => io.flatMap(() => f.interruptAs(id).asUnit));
}

/**
 * Interrupts all fibers and awaits their interruption
 *
 * @tsplus static fncts.io.FiberOps interruptAll
 */
export function interruptAll(fs: Iterable<Fiber<any, any>>, __tsplusTrace?: string): UIO<void> {
  return IO.fiberId.flatMap((id) => Fiber.interruptAllAs(fs, id));
}
