import type { Scope } from "../Scope.js";
import type { Subject } from "../Subject.js";
import type { Cause } from "@fncts/base/data/Cause";
import type { UnsafeSink } from "@fncts/io/Push/Sink";

import { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { IO } from "../IO.js";
import { AtomicSubject } from "./Atomic.js";

export interface Hold<E, A> extends Subject<never, E, A> {
  value: AtomicReference<Maybe<Exit<E, A>>>;
}

export class HoldSubject<E, A> extends AtomicSubject<E, A> implements Hold<E, A> {
  readonly value: AtomicReference<Maybe<Exit<E, A>>> = new AtomicReference(Nothing());

  onSuccess(value: A): IO<never, never, void> {
    return IO.defer(() => {
      this.value.set(Just(Exit.succeed(value)));
      return this.unsafeOnSuccess(value);
    });
  }

  onFailure(cause: Cause<E>): IO<never, never, void> {
    return IO.defer(() => {
      this.value.set(Just(Exit.failCause(cause)));
      return this.unsafeOnFailure(cause);
    });
  }

  run<R1>(sink: UnsafeSink<R1, E, A>): IO<Scope | R1, never, void> {
    return this.addSink(
      sink,
      (scope) =>
        this.value.get.match(
          () => IO.unit,
          (exit) =>
            exit.match(
              (cause) => sink.onFailure(cause),
              (value) => sink.onSuccess(value),
            ),
        ) > scope.awaitClose,
    );
  }

  interrupt: IO<never, never, void> = this.interruptScopes > IO(this.value.set(Nothing()));
}
