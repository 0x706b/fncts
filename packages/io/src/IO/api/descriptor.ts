/**
 * @tsplus static fncts.io.IOOps descriptorWith
 */
export function descriptorWith<R, E, A>(f: (descriptor: FiberDescriptor) => IO<R, E, A>): IO<R, E, A> {
  return IO.withFiberRuntime((fiber, status) => {
    const descriptor = new FiberDescriptor(fiber.id, status, fiber.getFiberRef(FiberRef.interruptedCause).interruptors);
    return f(descriptor);
  });
}

/**
 * @tsplus static fncts.io.IOOps descriptor
 */
export const descriptor: UIO<FiberDescriptor> = IO.descriptorWith((descriptor) => IO.succeedNow(descriptor));
