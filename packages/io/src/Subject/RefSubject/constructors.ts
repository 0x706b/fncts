import type { RefSubject } from "@fncts/io/Subject/RefSubject/RefSubject";

import { Atomic } from "@fncts/io/Subject/RefSubject/Atomic";

export interface RefSubjectOptions<A> {
  executionStrategy?: ExecutionStrategy;
  eq?: Eq<A>;
}

/**
 * @tsplus static fncts.io.RefSubject.PRefSubjectOps fromIO
 * @tsplus static fncts.io.RefSubject.RefSubjectOps fromIO
 */
export function fromIO<R, E, A>(
  initial: IO<R, E, A>,
  options?: RefSubjectOptions<A>,
): IO<Scope | R, never, RefSubject<never, E, A>> {
  return Do((Δ) => {
    const runtime           = Δ(IO.runtime<R | Scope>());
    const executionStrategy = options?.executionStrategy ?? ExecutionStrategy.concurrent;
    const scope             = Δ(runtime.environment.get(Scope.Tag).forkWith(executionStrategy));
    const fiberId           = Δ(IO.fiberId);
    const refSubject        = new Atomic(fiberId, initial, runtime, scope);
    Δ(scope.addFinalizer(refSubject.interrupt.provideEnvironment(runtime.environment)));
    return refSubject;
  });
}
