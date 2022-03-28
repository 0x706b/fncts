import type { IO, UIO } from "@fncts/base/control/IO";

import { Tag } from "@fncts/base/data/Tag";

/**
 * @tsplus type fncts.test.control.Sized
 * @tsplus companion fncts.test.control.SizedOps
 */
export abstract class Sized {
  abstract readonly size: UIO<number>;
  abstract withSize(size: number): <R, E, A>(io: IO<R, E, A>) => IO<R, E, A>;
}

export const SizedKey = Symbol.for("fncts.test.control.Sized.ServiceKey");

/**
 * @tsplus static fncts.test.control.SizedOps Tag
 */
export const SizedTag = Tag<Sized>(SizedKey);
