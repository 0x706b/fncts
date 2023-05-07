import type { Sink } from "@fncts/io/Push/definition";
import type { Subject } from "@fncts/io/Subject/definition";

import { Multicast, Push } from "@fncts/io/Push";
import { PushTypeId, PushVariance } from "@fncts/io/Push/definition";
import { SubjectTypeId } from "@fncts/io/Subject/definition";

export class AtomicSubject<E, A> implements Subject<never, E, A> {
  readonly [SubjectTypeId]: SubjectTypeId = SubjectTypeId;
  readonly [PushTypeId]: PushTypeId       = PushTypeId;
  declare [PushVariance]: {
    readonly _R: (_: never) => never;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };

  readonly stream = new Multicast<never, E, A>(Push.never);

  run<R>(emitter: Sink<R, E, A>): IO<R, never, unknown> {
    return this.stream.run(emitter);
  }

  event(value: A): IO<never, never, void> {
    return this.stream.event(value);
  }

  error(cause: Cause<E>): IO<never, never, void> {
    return this.stream.error(cause);
  }
}
