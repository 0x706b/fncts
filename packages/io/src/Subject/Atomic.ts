import type { Emitter } from "@fncts/io/Push";
import type { Subject } from "@fncts/io/Subject/definition";

import { Multicast, Push } from "@fncts/io/Push";
import { SubjectTypeId } from "@fncts/io/Subject/definition";

export class AtomicSubject<E, A> implements Subject<never, E, A> {
  readonly [SubjectTypeId]: SubjectTypeId = SubjectTypeId;
  declare _R: (_: never) => never;
  declare _E: (_: never) => E;
  declare _A: (_: never) => A;

  readonly stream = new Multicast<never, E, A>(Push.never);

  run<R>(emitter: Emitter<R, E, A>): IO<R | Scope, never, unknown> {
    return this.stream.run(emitter);
  }

  emit(value: A): IO<never, never, void> {
    return this.stream.emit(value);
  }

  failCause(cause: Cause<E>): IO<never, never, void> {
    return this.stream.failCause(cause);
  }

  end = this.stream.end;
}
