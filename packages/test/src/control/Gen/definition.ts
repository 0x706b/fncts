import type { Sample } from "../Sample.js";

/**
 * @tsplus type fncts.test.Gen
 * @tsplus companion fncts.test.GenOps
 */
export class Gen<R, A> {
  constructor(readonly sample: Stream<R, never, Maybe<Sample<R, A>>>) {}
}
