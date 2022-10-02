import type { Atomic as Atomic_ } from "./Atomic.js";
import type { Synchronized as Synchronized_ } from "./Synchronized.js";

export const RefTypeId = Symbol.for("fncts.io.Ref");
export type RefTypeId = typeof RefTypeId;

export declare namespace Ref {
  export type Atomic<A> = Atomic_<A>;
  export type Synchronized<A> = Synchronized_<A>;
}


/**
 * @tsplus type fncts.io.Ref
 * @tsplus companion fncts.io.RefOps
 */
export abstract class Ref<A> {
  readonly _typeId: RefTypeId = RefTypeId;
  declare _A: (_: A) => A;

  /**
   * Reads the value from the `Ref`.
   */
  abstract get: UIO<A>;

  /**
   * Writes a new value to the `Ref`, with a guarantee of immediate
   * consistency (at some cost to performance).
   */
  abstract set(a: A, __tsplusTrace?: string): UIO<void>;

  /**
   * Atomically modifies the `Ref` with the specified function, which
   * computes a return value for the modification. This is a more powerful
   * version of `update`.
   */
  abstract modify<B>(f: (a: A) => readonly [B, A], __tsplusTrace?: string): UIO<B>;

  /**
   * Atomically writes the specified value to the `Ref`, returning the value
   * immediately before modification.
   */
  getAndSet(a: A, __tsplusTrace?: string): UIO<A> {
    return this.modify((v) => [v, a]);
  }

  /**
   * Atomically modifies the `Ref` with the specified function, returning the
   * value immediately before modification.
   */
  getAndUpdate(f: (a: A) => A, __tsplusTrace?: string): UIO<A> {
    return this.modify((v) => [v, f(v)]);
  }

  /**
   * Atomically modifies the `Ref` with the specified partial function,
   * returning the value immediately before modification. If the function is
   * undefined on the current value it doesn't change it.
   */
  getAndUpdateJust(f: (a: A) => Maybe<A>, __tsplusTrace?: string): UIO<A> {
    return this.modify((v) => {
      const result = f(v).getOrElse(v);
      return [v, result];
    });
  }

  /**
   * Atomically modifies the `Ref` with the specified partial function, which
   * computes a return value for the modification if the function is defined on
   * the current value otherwise it returns a default value. This is a more
   * powerful version of `updateJust`.
   */
  modifyJust<B>(orElse: B, f: (a: A) => Maybe<readonly [B, A]>, __tsplusTrace?: string): UIO<B> {
    return this.modify((v) => f(v).getOrElse([orElse, v]));
  }

  /**
   * Atomically modifies the `Ref` with the specified function.
   */
  update(f: (a: A) => A, __tsplusTrace?: string): UIO<void> {
    return this.modify((v) => [undefined, f(v)]);
  }

  /**
   * Atomically modifies the `Ref` with the specified function and returns the
   * updated value.
   */
  updateAndGet(f: (a: A) => A, __tsplusTrace?: string): UIO<A> {
    return this.modify((v) => {
      const result = f(v);
      return [result, result];
    });
  }

  /**
   * Atomically modifies the `Ref` with the specified partial function. If the
   * function is undefined on the current value it doesn't change it.
   */
  updateJust(f: (a: A) => Maybe<A>, __tsplusTrace?: string): UIO<void> {
    return this.modify((v) => {
      const result = f(v).getOrElse(v);
      return [undefined, result];
    });
  }

  /**
   * Atomically modifies the `Ref` with the specified partial function. If the
   * function is undefined on the current value it returns the old value without
   * changing it.
   */
  updateJustAndGet(f: (a: A) => Maybe<A>, __tsplusTrace?: string): UIO<A> {
    return this.modify((v) => {
      const result = f(v).getOrElse(v);
      return [result, result];
    });
  }
}
