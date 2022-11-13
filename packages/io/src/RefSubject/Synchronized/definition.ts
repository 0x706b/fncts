import type { RefSubject } from "../definition.js";
import type { Cause } from "@fncts/base/data/Cause";
import type { Emitter } from "@fncts/io/Push";
import type { Scope } from "@fncts/io/Scope";

import { IO } from "@fncts/io/IO";

import { RefSubjectInternal } from "../definition.js";

export const SynchronizedRefSubjectTypeId = Symbol.for("fncts.io.Push.SynchronizedRefSubject");
export type SynchronizedRefSubjectTypeId = typeof SynchronizedRefSubjectTypeId;

/**
 * @tsplus type fncts.io.Push.RefSubject.Synchronized
 */
export interface SynchronizedRefSubject<R, E, A, B> extends RefSubject<R, E, A, B> {
  readonly [SynchronizedRefSubjectTypeId]: SynchronizedRefSubjectTypeId;
}

/**
 * @tsplus type fncts.io.Push.RefSubject.SynchronizedOps
 */
export interface SynchronizedRefSubjectOps {}

/**
 * @tsplus static fncts.io.Push.RefSubjectOps Synchronized
 */
export const Synchronized: SynchronizedRefSubjectOps = {};

export class SynchronizedRefSubjectInternal<R, E, A, B>
  extends RefSubjectInternal<R, E, A, B>
  implements SynchronizedRefSubject<R, E, A, B>
{
  readonly [SynchronizedRefSubjectTypeId]: SynchronizedRefSubjectTypeId = SynchronizedRefSubjectTypeId;
  constructor(readonly semaphore: TSemaphore, readonly ref: RefSubjectInternal<R, E, A, B>) {
    super();
  }

  get get(): IO<R, never, B> {
    return this.withPermit(this.ref.get);
  }

  set(a: A, __tsplusTrace?: string | undefined): IO<R, never, void> {
    return this.withPermit(this.ref.set(a));
  }

  run<R1>(emitter: Emitter<R1, E, B>): IO<Scope | R | R1, never, void> {
    return this.ref.run(emitter);
  }

  modify<C>(
    f: (b: B) => readonly [C, A],
    __tsplusTrace?: string | undefined,
  ): IO<R, never, C> {
    return this.modifyIO((a) => IO.succeedNow(f(a)));
  }

  modifyIO<R1, E1, C>(
    f: (b: B) => IO<R1, E1, readonly [C, A]>,
    __tsplusTrace?: string,
  ): IO<R | R1, E1, C> {
    return this.withPermit(this.ref.get.flatMap(f).flatMap(([b, a]) => this.ref.set(a).as(b)));
  }

  emit(value: A): IO<R, never, void> {
    return this.withPermit(this.ref.emit(value));
  }

  failCause(cause: Cause<E>): IO<R, never, void> {
    return this.withPermit(this.ref.failCause(cause));
  }

  end: IO<R, never, void> = this.withPermit(this.ref.end);

  withPermit<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
    return this.semaphore.withPermit(io);
  }
}
