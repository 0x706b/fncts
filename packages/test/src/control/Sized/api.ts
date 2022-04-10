import { Sized } from "./definition.js";

/**
 * @tsplus static fncts.test.control.SizedOps size
 */
export const size: URIO<Has<Sized>, number> = IO.serviceWithIO((sized) => sized.size, Sized.Tag);

/**
 * @tsplus static fncts.test.control.SizedOps withSize
 */
export function withSize(size: number) {
  return <R, E, A>(io: IO<R, E, A>): IO<R & Has<Sized>, E, A> =>
    IO.serviceWithIO((sized) => sized.withSize(size)(io), Sized.Tag);
}
