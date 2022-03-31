import type { Has } from "../../prelude.js";
import type { FIO, UIO } from "../IO.js";

import { Exit } from "../../data/Exit.js";
import { IO } from "../IO.js";
import { Ref } from "../Ref.js";
import { Scope } from "../Scope.js";
import { ScopedRef } from "./definition.js";

/**
 * @tsplus static fncts.control.ScopedRefOps fromAcquire
 */
export function fromAcquire<R, E, A>(
  acquire: IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R & Has<Scope>, E, ScopedRef<A>> {
  return IO.uninterruptibleMask(({ restore }) =>
    IO.gen(function* (_) {
      const newScope = yield* _(Scope.make);
      const a        = yield* _(
        restore(acquire(IO.$.provideService(Scope.Tag)(newScope))).tapCause((cause) =>
          newScope.close(Exit.fail(cause)),
        ),
      );
      const ref       = yield* _(Ref.Synchronized.make([newScope, a] as const));
      const scopedRef = new Synch(ref);
      yield* _(IO.addFinalizer(scopedRef.close));
      return scopedRef;
    }),
  );
}

class Synch<A> extends ScopedRef<A> {
  constructor(readonly ref: Ref.Synchronized<readonly [Scope.Closeable, A]>) {
    super();
  }

  close: UIO<void> = this.ref.get.chain(([scope, _]) => scope.close(Exit.unit));

  set<R, E>(acquire: IO<R & Has<Scope>, E, A>, __tsplusTrace?: string): IO<R, E, void> {
    return this.ref.modifyIO(([oldScope, a]) =>
      IO.uninterruptibleMask(({ restore }) =>
        IO.gen(function* (_) {
          const newScope = yield* _(Scope.make);
          const exit     = yield* _(restore(acquire(IO.$.provideService(Scope.Tag)(newScope))).result);
          return yield* _(
            exit.match(
              (cause): UIO<readonly [FIO<E, void>, readonly [Scope.Closeable, A]]> =>
                newScope
                  .close(Exit.unit)
                  .ignore.as([IO.failCauseNow(cause), [oldScope, a]] as const),
              (a) => oldScope.close(Exit.unit).ignore.as([IO.unit, [newScope, a]] as const),
            ),
          );
        }),
      ),
    ).flatten;
  }

  get: UIO<A> = this.ref.get.map(([_, a]) => a);
}
