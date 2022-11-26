import type { Emitter } from "../Push.js";
import type { Push } from "../Push.js";
import type { ModifiableRef, ReadableRef, WritableRef } from "../Ref.js";
import type { SynchronizedRefSubject } from "@fncts/io/RefSubject/Synchronized/definition";

import { PushTypeId } from "../Push.js";
import { PushVariance } from "../Push.js";
import { RefVariance } from "../Ref.js";

/**
 * @tsplus type fncts.io.Push.RefSubject
 */
export interface RefSubject<out R, in out E, in A, out B> extends Push<R, E, B>, Emitter<R, E, A> {}

/**
 * @tsplus type fncts.io.Push.RefSubjectOps
 */
export interface RefSubjectOps {}

export const RefSubject: RefSubjectOps = {};

export declare namespace RefSubject {
  export type Synchronized<R, E, A, B> = SynchronizedRefSubject<R, E, A, B>;
}

export abstract class RefSubjectInternal<R, E, A, B>
  implements
    ReadableRef<R, never, B>,
    WritableRef<R, never, A>,
    ModifiableRef<R, R, never, never, A, B>,
    Push<R, E, B>,
    Emitter<R, E, A>
{
  readonly [PushTypeId]: PushTypeId = PushTypeId;
  declare [RefVariance]: {
    readonly _RA: (_: never) => R;
    readonly _RB: (_: never) => R;
    readonly _EA: (_: never) => never;
    readonly _EB: (_: never) => never;
    readonly _A: (_: A) => void;
    readonly _B: (_: never) => B;
  };
  declare [PushVariance]: {
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: A) => B;
  };

  abstract get get(): IO<R, never, B>;

  abstract set(value: A): IO<R, never, void>;

  abstract modify<C>(f: (b: B) => readonly [C, A], __tsplusTrace?: string): IO<R, never, C>;

  abstract run<R1>(emitter: Emitter<R1, E, B>): IO<Scope | R | R1, never, void>;

  abstract failCause(cause: Cause<E>): IO<R, never, void>;

  abstract emit(value: A): IO<R, never, void>;

  abstract end: IO<R, never, void>;
}

/**
 * @tsplus macro remove
 */
export function concrete<R, E, A, B>(_: RefSubject<R, E, A, B>): asserts _ is RefSubjectInternal<R, E, A, B> {
  //
}
