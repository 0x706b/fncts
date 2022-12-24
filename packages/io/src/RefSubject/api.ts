import { tuple } from "@fncts/base/data/function";
import { Emitter } from "@fncts/io/Push";
import { AtomicRefSubject } from "@fncts/io/RefSubject/Atomic";

import { RefSubject } from "./definition.js";
import { RefSubjectInternal } from "./definition.js";
import { concrete } from "./definition.js";

/**
 * @tsplus static fncts.io.Push.RefSubjectOps unsafeMake
 */
export function unsafeMake<A>(initial: A): RefSubject<never, never, A, A> {
  return new AtomicRefSubject(initial);
}

/**
 * @tsplus static fncts.io.Push.RefSubjectOps make
 * @tsplus static fncts.io.Push.RefSubjectOps __call
 */
export function make<A>(initial: Lazy<A>): UIO<RefSubject<never, never, A, A>> {
  return IO(RefSubject.unsafeMake(initial()));
}

/**
 * Reads the value from the `Ref`.
 *
 * @tsplus getter fncts.io.Push.RefSubject get
 */
export function get<R, E, A, B>(self: RefSubject<R, E, A, B>, __tsplusTrace?: string): IO<R, never, B> {
  concrete(self);
  return self.get;
}

/**
 * Writes a new value to the `Ref`, with a guarantee of immediate
 * consistency (at some cost to performance).
 *
 * @tsplus pipeable fncts.io.Push.RefSubject set
 */
export function set<A>(a: A, __tsplusTrace?: string) {
  return <R, E, B>(self: RefSubject<R, E, A, B>): IO<R, never, void> => {
    concrete(self);
    return self.set(a);
  };
}

class Dimap<R, E, A, B, C, D> extends RefSubjectInternal<R, E, C, D> {
  constructor(readonly ref: RefSubjectInternal<R, E, A, B>, readonly f: (c: C) => A, readonly g: (b: B) => D) {
    super();
  }

  get get(): IO<R, never, D> {
    return this.ref.get.map(this.g);
  }

  set(value: C): IO<R, never, void> {
    return this.ref.set(this.f(value));
  }

  modify<F>(f: (d: D) => readonly [F, C], __tsplusTrace?: string | undefined): IO<R, never, F> {
    return this.get.flatMap((c) => {
      const o = f(c);
      return this.set(o[1]) > IO.succeedNow(o[0]);
    });
  }

  run<R1>(emitter: Emitter<R1, E, D>): IO<Scope | R | R1, never, void> {
    return this.ref.run(
      Emitter(
        (value) => emitter.emit(this.g(value)),
        (cause) => emitter.failCause(cause),
        emitter.end,
      ),
    );
  }

  emit(value: C): IO<R, never, void> {
    return this.ref.emit(this.f(value));
  }

  failCause(cause: Cause<E>): IO<R, never, void> {
    return this.ref.failCause(cause);
  }

  end: IO<R, never, void> = this.ref.end;

  get unsafeGet(): D {
    return this.g(this.ref.unsafeGet);
  }
}

/**
 * Transforms both the `set` and `get` values of the `Ref` with the
 * specified functions.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject dimap
 */
export function dimap<A, B, C, D>(f: (_: C) => A, g: (_: B) => D, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, B>): RefSubject<R, E, C, D> => {
    concrete(self);
    return new Dimap(self, f, g);
  };
}

/**
 * Transforms the `set` value of the `Ref` with the specified function.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject contramap
 */
export function contramap<A, C>(f: (_: C) => A, __tsplusTrace?: string) {
  return <R, E, B>(self: RefSubject<R, E, A, B>): RefSubject<R, E, C, B> => {
    return self.dimap(f, Function.identity);
  };
}

/**
 * Transforms the `get` value of the `Ref` with the specified function.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject map
 */
export function map<B, C>(f: (_: B) => C, __tsplusTrace?: string) {
  return <R, E, A>(ref: RefSubject<R, E, A, B>): RefSubject<R, E, A, C> => {
    return ref.dimap(Function.identity, f);
  };
}

/**
 * Atomically modifies the `Ref` with the specified function, which
 * computes a return value for the modification. This is a more powerful
 * version of `update`.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject modify
 */
export function modify<B, A>(f: (a: A) => readonly [B, A], __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, B> => {
    concrete(self);
    return self.modify(f);
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function,
 * which computes a return value for the modification if the function is
 * defined on the current value otherwise it returns a default value. This
 * is a more powerful version of `updateJust`.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject modifyJust
 */
export function modifyJust<A, B>(def: B, f: (a: A) => Maybe<readonly [B, A]>, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, B> => {
    return self.modify((a) => f(a).getOrElse(tuple(def, a)));
  };
}

/**
 * Atomically writes the specified value to the `Ref`, returning the value
 * immediately before modification.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject getAndSet
 */
export function getAndSet<A>(a: A, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, A> => {
    return self.modify((a0) => tuple(a0, a));
  };
}

/**
 * Atomically modifies the `Ref` with the specified function, returning
 * the value immediately before modification.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject getAndUpdate
 */
export function getAndUpdate<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, E, A> => {
    return self.modify((a0) => tuple(a0, f(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function,
 * returning the value immediately before modification. If the function is
 * undefined on the current value it doesn't change it.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject getAndUpdateJust
 */
export function getAndUpdateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, A> => {
    return self.modify((a0) => tuple(a0, f(a0).getOrElse(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified function.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject update
 */
export function update<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, void> => {
    return self.modify((a0) => tuple(undefined, f(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified function and returns
 * the updated value.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject updateAndGet
 */
export function updateAndGet<A>(f: (a: A) => A, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>) => {
    return self.modify((a0) => {
      const r = f(a0);
      return tuple(r, r);
    });
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function. If
 * the function is undefined on the current value it doesn't change it.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject updateJust
 */
export function updateJust<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, void> => {
    return self.modify((a0) => tuple(undefined, f(a0).getOrElse(a0)));
  };
}

/**
 * Atomically modifies the `Ref` with the specified partial function. If
 * the function is undefined on the current value it returns the old value
 * without changing it.
 *
 * @tsplus pipeable fncts.io.Push.RefSubject updateJustAndGet
 */
export function updateJustAndGet<A>(f: (a: A) => Maybe<A>, __tsplusTrace?: string) {
  return <R, E>(self: RefSubject<R, E, A, A>): IO<R, never, A> => {
    return self.modify((a0) => {
      const r = f(a0).getOrElse(a0);
      return tuple(r, r);
    });
  };
}

/**
 * @tsplus getter fncts.io.Push.RefSubject unsafeGet
 */
export function unsafeGet<R, E, A, B>(self: RefSubject<R, E, A, B>): B {
  concrete(self);
  return self.unsafeGet;
}
