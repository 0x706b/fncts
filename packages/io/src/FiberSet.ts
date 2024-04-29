export const FiberSetTypeId = Symbol.for("fncts.io.FiberSet");
export type FiberSetTypeId = typeof FiberSetTypeId;

/**
 * @tsplus type fncts.io.FiberSet
 * @tsplus companion fncts.io.FiberSetOps
 */
export class FiberSet<E, A> {
  readonly [FiberSetTypeId]: FiberSetTypeId = FiberSetTypeId;
  constructor(
    readonly backing: Set<Fiber.Runtime<E, A>>,
    readonly future: Future<unknown, never>,
  ) {}
}

/**
 * @tsplus static fncts.io.FiberSetOps unsafeMake
 */
export function unsafeMake<E, A>(backing: Set<Fiber.Runtime<E, A>>, future: Future<unknown, never>): FiberSet<E, A> {
  return new FiberSet(backing, future);
}

/**
 * @tsplus static fncts.io.FiberSetOps make
 */
export function make<E, A>(): IO<Scope, never, FiberSet<E, A>> {
  return IO.acquireRelease(
    Future.make<unknown, never>().map((future) => FiberSet.unsafeMake(new Set<Fiber.Runtime<E, A>>(), future)),
    (fiberSet) => fiberSet.clear,
  );
}

/**
 * @tsplus static fncts.io.FiberSetOps makeRuntime
 */
export function makeRuntime<R, E, A>(): IO<
  Scope | R,
  never,
  <XE extends E, XA extends A>(io: IO<R, XE, XA>) => Fiber.Runtime<XE, XA>
> {
  return make<E, A>().flatMap((fiberSet) => fiberSet.runtime());
}

/**
 * @tsplus pipeable fncts.io.FiberSet unsafeAdd
 */
export function unsafeAdd<XE extends E, XA extends A, E, A>(fiber: Fiber.Runtime<XE, XA>) {
  return (self: FiberSet<E, A>): void => {
    if (self.backing.has(fiber)) {
      return;
    }
    self.backing.add(fiber);
    fiber.addObserver((exit) => {
      self.backing.delete(fiber);
      if (exit.isFailure() && !exit.cause.isInterruptedOnly) {
        self.future.unsafeDone(exit);
      }
    });
  };
}

/**
 * @tsplus pipeable fncts.io.FiberSet add
 */
export function add<XE extends E, XA extends A, E, A>(fiber: Fiber.Runtime<XE, XA>) {
  return (self: FiberSet<E, A>): UIO<void> => IO(self.unsafeAdd(fiber));
}

/**
 * @tsplus pipeable fncts.io.FiberSet runtime
 */
export function runtime<R = never>() {
  return <E, A>(
    self: FiberSet<E, A>,
  ): IO<R, never, <XE extends E, XA extends A>(io: IO<R, XE, XA>) => Fiber.Runtime<XE, XA>> => {
    return IO.runtime<R>().map((runtime) => {
      const runFork = runtime.unsafeRunFiber;
      return (io) => {
        const fiber = runFork(io);
        self.unsafeAdd(fiber);
        return fiber;
      };
    });
  };
}

/**
 * @tsplus pipeable fncts.io.FiberSet run
 */
export function run<R, XE extends E, XA extends A, E, A>(io: IO<R, XE, XA>) {
  return (self: FiberSet<E, A>): IO<R, never, Fiber.Runtime<XE, XA>> => {
    return io.forkDaemon.tap((fiber) => self.add(fiber));
  };
}

/**
 * @tsplus getter fncts.io.FiberSet size
 */
export function size<E, A>(self: FiberSet<E, A>): UIO<number> {
  return IO(self.backing.size);
}

/**
 * @tsplus getter fncts.io.FiberSet join
 */
export function join<E, A>(self: FiberSet<E, A>): FIO<E, never> {
  return (self.future as Future<E, never>).await;
}

/**
 * @tsplus getter fncts.io.FiberSet clear
 */
export function clear<E, A>(self: FiberSet<E, A>): UIO<void> {
  return IO.foreach(self.backing, (fiber) => fiber.interrupt) > IO(self.backing.clear());
}
