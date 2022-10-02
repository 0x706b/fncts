import { IO } from "@fncts/io/IO";

import { RefInternal } from "./definition.js";

/**
 * @tsplus type fncts.io.Ref.Synchronized
 */
export interface Synchronized<A> extends SynchronizedInternal<A> {}

/**
 * @tsplus type fncts.io.Ref.SynchronizedOps
 */
export interface SynchronizedOps {}

/**
 * @tsplus static fncts.io.RefOps Synchronized
 */
export const Synchronized: SynchronizedOps = {};

/**
 * @tsplus type fncts.io.Ref.Synchronized
 */
export class SynchronizedInternal<A> extends RefInternal<A> {
  readonly _tag = "Synchronized";
  constructor(readonly semaphore: TSemaphore, readonly unsafeGet: UIO<A>, readonly unsafeSet: (a: A) => UIO<void>) {
    super();
  }

  /**
   * Reads the value from the `Ref`.
   */
  get get(): UIO<A> {
    return this.withPermit(this.unsafeGet);
  }

  /**
   * Writes a new value to the `Ref`, with a guarantee of immediate
   * consistency (at some cost to performance).
   */
  set(a: A, __tsplusTrace?: string): UIO<void> {
    return this.withPermit(this.unsafeSet(a));
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified function,
   * which computes a return value for the modification. This is a more
   * powerful version of `update`.
   */
  modifyIO<R, E, B>(f: (a: A) => IO<R, E, readonly [B, A]>, __tsplusTrace?: string): IO<R, E, B> {
    return this.withPermit(this.unsafeGet.flatMap(f).flatMap(([b, a]) => this.unsafeSet(a).as(b)));
  }

  modify<B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string | undefined): UIO<B> {
    return this.modifyIO((a) => IO.succeedNow(f(a)));
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified function,
   * returning the value immediately before modification.
   */
  getAndUpdateIO<R, E>(f: (a: A) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
    return this.modifyIO((v) => f(v).map((result) => [v, result]));
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified partial
   * function, returning the value immediately before modification. If the
   * function is undefined on the current value it doesn't change it.
   */
  getAndUpdateJustIO<R, E>(f: (a: A) => Maybe<IO<R, E, A>>): IO<R, E, A> {
    return this.modifyIO((v) =>
      f(v)
        .getOrElse(IO.succeedNow(v))
        .map((result) => [v, result]),
    );
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified function,
   * which computes a return value for the modification if the function is
   * defined in the current value otherwise it returns a default value. This
   * is a more powerful version of `updateSome`.
   */
  modifyJustIO<R, E, B>(orElse: B, f: (a: A) => Maybe<IO<R, E, readonly [B, A]>>, __tsplusTrace?: string): IO<R, E, B> {
    return this.modifyIO((v) => f(v).getOrElse(IO.succeedNow([orElse, v] as const)));
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified function.
   */
  updateIO<R, E>(f: (a: A) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, void> {
    return this.modifyIO((v) => f(v).map((result) => [undefined, result] as const));
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified function,
   * returning the value immediately after modification.
   */
  updateAndGetIO<R, E>(f: (a: A) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
    return this.modifyIO((v) => f(v).map((result) => [result, result]));
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified partial
   * function. If the function is undefined on the current value it doesn't
   * change it.
   */
  updateJustIO<R, E>(f: (a: A) => Maybe<IO<R, E, A>>, __tsplusTrace?: string): IO<R, E, void> {
    return this.modifyIO((v) =>
      f(v)
        .getOrElse(IO.succeedNow(v))
        .map((result) => [undefined, result]),
    );
  }

  /**
   * Atomically modifies the `Ref.Synchronized` with the specified partial
   * function. If the function is undefined on the current value it returns
   * the old value without changing it.
   */
  updateJustAndGetIO<R, E>(f: (a: A) => Maybe<IO<R, E, A>>, __tsplusTrace?: string): IO<R, E, A> {
    return this.modifyIO((v) =>
      f(v)
        .getOrElse(IO.succeedNow(v))
        .map((result) => [result, result]),
    );
  }

  protected withPermit<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
    return this.semaphore.withPermit(io);
  }
}
