import type { Sample } from "../Sample";
import type { Stream } from "@fncts/base/control/Stream";
import type { Maybe } from "@fncts/base/data/Maybe";

/**
 * @tsplus type fncts.test.control.Gen
 * @tsplus companion fncts.test.control.GenOps
 */
export class Gen<R, A> {
  constructor(readonly sample: Stream<R, never, Maybe<Sample<R, A>>>) {}
}
