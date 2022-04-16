/**
 * @tsplus type fncts.test.Sized
 * @tsplus companion fncts.test.SizedOps
 */
export abstract class Sized {
  abstract readonly size: UIO<number>;
  abstract withSize(size: number): <R, E, A>(io: IO<R, E, A>) => IO<R, E, A>;
}

/**
 * @tsplus static fncts.test.SizedOps Tag
 */
export const SizedTag = Tag<Sized>();
