import type { IO } from "../../IO";
import type { Ref } from "../definition";

/**
 * @tsplus fluent fncts.control.Ref.Synchronized modifyIO
 */
export function modifyIO_<RA, RB, EA, EB, A, R1, E1, B>(
  self: Ref.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => IO<R1, E1, readonly [B, A]>
): IO<RA & RB & R1, EA | EB | E1, B> {
  return self.withPermit(
    self.unsafeGet.chain(f).chain(([b, a]) => self.unsafeSet(a).as(b))
  );
}
