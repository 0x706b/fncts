import type { Lazy } from "../../../data/function.js";
import type { UIO } from "../../IO.js";

import { IO } from "../../IO.js";
import { TSemaphore } from "../../TSemaphore.js";
import { Ref } from "../definition.js";
import { PSynchronizedInternal } from "./definition.js";

/**
 * @tsplus static fncts.control.Ref.SynchronizedOps make
 */
export function make<A>(a: Lazy<A>): UIO<Ref.Synchronized<A>> {
  return IO.gen(function* (_) {
    const ref       = yield* _(Ref.make(a));
    const semaphore = yield* _(TSemaphore.make(1).commit);
    return new PSynchronizedInternal(new Set([semaphore]), ref.get, (a) => ref.set(a));
  });
}
