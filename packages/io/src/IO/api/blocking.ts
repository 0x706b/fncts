import { backgroundScheduler } from "@fncts/io/internal/BackgroundScheduler";

/**
 * @tsplus static fncts.io.IOOps blocking
 * @tsplus getter fncts.io.IO blocking
 */
export function blocking<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return FiberRef.currentScheduler.locally(backgroundScheduler)(IO.yieldNow) > self;
}
