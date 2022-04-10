/**
 * @tsplus type fncts.test.control.Sized
 * @tsplus companion fncts.test.control.SizedOps
 */
export abstract class Sized {
  abstract readonly size: UIO<number>;
  abstract withSize(size: number): <R, E, A>(io: IO<R, E, A>) => IO<R, E, A>;
}

/**
 * @tsplus static fncts.test.control.SizedOps Tag
 */
export const SizedTag = Tag<Sized>();
