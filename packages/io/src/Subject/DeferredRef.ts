import type { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { External, IO } from "../IO.js";

export class FutureRef<E, A> extends External<never, E, A> {
  public version = -1;
  public future!: Future<E, A>;

  constructor(
    readonly fiberId: FiberId,
    readonly current: AtomicReference<Maybe<Exit<E, A>>>,
  ) {
    super();
    this.reset();
  }

  toIO: IO<never, E, A> = IO.defer(() => {
    const current = this.current.get;
    if (current.isNothing()) {
      return this.future.await;
    } else {
      return current.value!;
    }
  });

  done(exit: Exit<E, A>) {
    const current = this.current.get;
    if (current.isJust() && Equatable.strictEquals(current.value, exit)) {
      return false;
    }
    this.future.unsafeDone(exit);
    this.version += 1;
    return true;
  }

  reset() {
    this.current.set(Nothing());
    this.version = -1;
    if (this.future) {
      this.future.unsafeDone(Exit.interrupt(this.fiberId));
    }
    this.future = Future.unsafeMake(this.fiberId);
  }
}
