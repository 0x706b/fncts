import { Sized } from "./definition.js";

/**
 * @tsplus static fncts.test.SizedOps size
 */
export const size: URIO<Sized, number> = IO.serviceWithIO((sized) => sized.size, Sized.Tag);

/**
 * @tsplus static fncts.test.SizedOps withSize
 */
export function withSize(size: number) {
  return <R, E, A>(io: IO<R, E, A>): IO<R | Sized, E, A> =>
    IO.serviceWithIO((sized) => sized.withSize(size)(io), Sized.Tag);
}
