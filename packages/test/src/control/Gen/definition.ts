import type { Sample } from "../Sample.js";

/**
 * @tsplus type fncts.test.control.Gen
 * @tsplus companion fncts.test.control.GenOps
 */
export class Gen<R, A> {
  constructor(readonly sample: Stream<R, never, Maybe<Sample<R, A>>>) {}
}
