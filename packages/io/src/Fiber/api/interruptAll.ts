/**
 * Interrupts all fibers as by the specified fiber, awaiting their interruption.
 *
 * @tsplus static fncts.control.FiberOps interruptAllAs
 */
export function interruptAllAs_(fs: Iterable<Fiber<any, any>>, id: FiberId): UIO<void> {
  return fs.foldLeft(IO.unit, (io, f) => io.flatMap(() => f.interruptAs(id).asUnit));
}

/**
 * Interrupts all fibers and awaits their interruption
 *
 * @tsplus static fncts.control.FiberOps interruptAll
 */
export function interruptAll(fs: Iterable<Fiber<any, any>>): UIO<void> {
  return IO.fiberId.flatMap((id) => Fiber.interruptAllAs(fs, id));
}
