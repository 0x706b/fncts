import type { Scope } from "../Scope.js";
import type { Push } from "@fncts/io/Push";
import type { UnsafeSink } from "@fncts/io/Push/Sink";

import { HashSet as MutableHashSet } from "@fncts/base/collection/mutable/HashSet";
import { PushTypeId, PushVariance } from "@fncts/io/Push/definition";
import { withScope } from "@fncts/io/Push/internal";
import { PSubject } from "@fncts/io/Subject/definition";
import { SubjectTypeId } from "@fncts/io/Subject/definition";

import { IO } from "../IO.js";

export class AtomicSubject<E, A> extends PSubject<Scope, never, E, E, A, A> {
  readonly [SubjectTypeId]: SubjectTypeId = SubjectTypeId;
  readonly [PushTypeId]: PushTypeId       = PushTypeId;
  declare [PushVariance]: {
    readonly _R: (_: never) => never;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };

  get subscribers(): number {
    return this.sinks.size;
  }

  protected sinks = MutableHashSet.empty<readonly [UnsafeSink<any, E, A>, Environment<any>, Scope.Closeable]>();

  protected interruptScopes = IO.fiberIdWith((fiberId) =>
    this.sinks.foreachDiscardIO(([, , scope]) => scope.close(Exit.interrupt(fiberId))),
  );

  readonly interrupt = this.interruptScopes;

  run<R1>(sink: UnsafeSink<R1, E, A>): IO<Scope | R1, never, void> {
    return this.addSink(sink, (scope) => scope.awaitClose);
  }

  onSuccess(value: A): IO<never, never, void> {
    return IO.defer(this.unsafeOnSuccess(value));
  }

  onFailure(cause: Cause<E>): IO<never, never, void> {
    return IO.defer(this.unsafeOnFailure(cause));
  }

  protected addSink<R, R1, B>(
    sink: UnsafeSink<R, E, A>,
    f: (scope: Scope) => IO<R1, never, B>,
  ): IO<Scope | R1, never, B> {
    return withScope(
      (innerScope) =>
        IO.environmentWithIO((environment) => {
          const entry = [sink, environment, innerScope] as const;
          this.sinks.add(entry);
          const remove = IO(this.sinks.remove(entry));
          return innerScope.addFinalizer(remove) > f(innerScope);
        }),
      ExecutionStrategy.sequential,
    );
  }

  protected unsafeOnSuccess(a: A) {
    if (this.sinks.size === 0) {
      return IO.unit;
    } else {
      return this.sinks.foreachDiscardIO(([sink, environment]) =>
        sink
          .onSuccess(a)
          .catchAllCause((cause) => sink.onFailure(cause))
          .provideSomeEnvironment(environment),
      );
    }
  }

  protected unsafeOnFailure(cause: Cause<E>) {
    if (this.sinks.size === 0) {
      return IO.unit;
    } else {
      return this.sinks.foreachDiscardIO(([sink, environment, scope]) =>
        sink
          .onFailure(cause)
          .catchAllCause((error) => scope.close(Exit.failCause(error)))
          .provideSomeEnvironment(environment),
      );
    }
  }
}
