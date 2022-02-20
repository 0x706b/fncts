import type { Lazy } from "../../../data/function";
import type { UIO } from "../../IO";

import { IO } from "../../IO";
import { TSemaphore } from "../../TSemaphore";
import { Ref } from "../definition";
import { PSynchronizedInternal } from "./definition";

/**
 * @tsplus static fncts.control.Ref.SynchronizedOps make
 */
export function make<A>(a: Lazy<A>): UIO<Ref.Synchronized<A>> {
  return IO.gen(function* (_) {
    const ref       = yield* _(Ref.make(a));
    const semaphore = yield* _(TSemaphore.make(1).atomically);
    return new PSynchronizedInternal(new Set([semaphore]), ref.get, (a) =>
      ref.set(a)
    );
  });
}
