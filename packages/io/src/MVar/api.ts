import type { MVar } from "./definition";

import { concrete } from "./definition.js";
import { MVarInternal } from "./definition.js";

/**
 * @tsplus static fncts.io.MVarOps empty
 */
export function empty<A>(): UIO<MVar<A>> {
  return TRef.make<Maybe<A>>(Nothing()).map((content) => new MVarInternal(content)).commit;
}

/**
 * @tsplus static fncts.io.MVarOps make
 * @tsplus static fncts.io.MVarOps __call
 */
export function make<A>(value: A): UIO<MVar<A>> {
  return TRef.make(Just(value)).map((content) => new MVarInternal(content)).commit;
}

/**
 * Check whether the `MVar` is empty.
 *
 * Notice that the boolean value returned is just a snapshot of the state of
 * the `MVar`. By the time you get to react on its result, the `MVar` may have
 * been filled (or emptied) - so be extremely careful when using this
 * operation. Use `tryTake` instead if possible.
 *
 * @tsplus getter fncts.io.MVar isEmpty
 */
export function isEmpty<A>(self: MVar<A>): UIO<boolean> {
  concrete(self);
  return self.content.get.map((value) => value.isNothing()).commit;
}

/**
 * A slight variation on `update` that allows a value to be returned (`b`) in
 * addition to the modified value of the `MVar`.
 *
 * @tsplus fluent fncts.io.MVar modify
 */
export function modify<A, B>(self: MVar<A>, f: (a: A) => readonly [B, A]): UIO<B> {
  concrete(self);
  return self.content.get
    .filterMap((value) =>
      value.map((a) => {
        const [b, newA] = f(a);
        return [b, Just(newA)] as const;
      }),
    )
    .flatMap(([b, newA]) => self.content.set(newA).as(b)).commit;
}

/**
 * Put a value into an `MVar`. If the `MVar` is currently full, `put` will
 * wait until it becomes empty.
 *
 * @tsplus fluent fncts.io.MVar put
 */
export function put<A>(self: MVar<A>, value: A): UIO<void> {
  concrete(self);
  return (self.content.get.filterMap(Function.identity) > self.content.set(Just(value))).commit;
}

/**
 * Atomically read the contents of an `MVar`. If the `MVar` is currently
 * empty, `read` will wait until it is full. `read` is guaranteed to receive
 * the next `put`.
 *
 * @tsplus getter fncts.io.MVar read
 */
export function read<A>(self: MVar<A>): UIO<A> {
  concrete(self);
  return self.content.get.filterMap(Function.identity).commit;
}

/**
 * Take a value from an `MVar`, put a new value into the `MVar` and return the
 * value taken.
 *
 * @tsplus fluent fncts.io.MVar swap
 */
export function swap<A>(self: MVar<A>, value: A): UIO<A> {
  concrete(self);
  return Do((Δ) => {
    const ref = Δ(self.content.get);
    return Δ(
      ref.match(
        () => STM.retry,
        (y) => self.content.set(Just(value)).as(y),
      ),
    );
  }).commit;
}

/**
 * Return the contents of the `MVar`. If the `MVar` is currently empty, `take`
 * will wait until it is full. After a `take`, the `MVar` is left empty.
 *
 * @tsplus getter fncts.io.MVar take
 */
export function take<A>(self: MVar<A>): UIO<A> {
  concrete(self);
  return self.content.get.filterMap(Function.identity).flatMap((a) => self.content.set(Nothing()).as(a)).commit;
}

/**
 * A non-blocking version of `put`. The `tryPut` function attempts to put the
 * value into the `MVar`, returning `true` if it was successful, or
 * `false` otherwise.
 *
 * @tsplus fluent fncts.io.MVar tryPut
 */
export function tryPut<A>(self: MVar<A>, value: A): UIO<boolean> {
  concrete(self);
  return self.content.get.flatMap((v) =>
    v.match(
      () => self.content.set(Just(value)).as(true),
      () => STM.succeedNow(false),
    ),
  ).commit;
}

/**
 * A non-blocking version of `read`. The `tryRead` function returns
 * immediately, with `None` if the `MVar` was empty, or `Some(x)` if the
 * `MVar` was full with contents `x`.
 *
 * @tsplus getter fncts.io.MVar tryRead
 */
export function tryRead<A>(self: MVar<A>): UIO<Maybe<A>> {
  concrete(self);
  return self.content.get.commit;
}

/**
 * A non-blocking version of `take`. The `tryTake` action returns immediately,
 * with `None` if the `MVar` was empty, or `Some(x)` if the `MVar` was full
 * with contents `x`. After `tryTake`, the `MVar` is left empty.
 *
 * @tsplus getter fncts.io.MVar tryTake
 */
export function tryTake<A>(self: MVar<A>): UIO<Maybe<A>> {
  concrete(self);
  return Do((Δ) => {
    const c = Δ(self.content.get);
    return Δ(
      c.match(
        () => STM.succeedNow(Nothing()),
        (a) => self.content.set(Nothing()) > STM.succeedNow(Just(a)),
      ),
    );
  }).commit;
}

/**
 * Replaces the contents of an `MVar` with the result of `f(a)`.
 *
 * @tsplus fluent fncts.io.MVar update
 */
export function update<A>(self: MVar<A>, f: (a: A) => A): UIO<void> {
  concrete(self);
  return self.content.get.filterMap((value) => value.map(f)).flatMap((a) => self.content.set(Just(a))).commit;
}
