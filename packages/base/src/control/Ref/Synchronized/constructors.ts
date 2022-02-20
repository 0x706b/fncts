import type { Lazy } from "../../../data/function";
import type { UIO } from "../../IO";

import { IO } from "../../IO";
import { TSemaphore } from "../../TSemaphore";
import { Ref } from "../definition";
import { PSynchronized } from "./definition";

export function make<A>(
  a: Lazy<A>
): UIO<Ref.Synchronized<unknown, unknown, never, never, A, A>> {
  return IO.gen(function* (_) {
    const ref       = yield* _(Ref.make(a));
    const semaphore = yield* _(TSemaphore.make(1).atomically);
    return new PSynchronized(new Set([semaphore]), ref.get, (a) => ref.set(a));
  });
}
