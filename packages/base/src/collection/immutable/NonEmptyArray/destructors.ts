import type { Array } from "../Array";
import type { NonEmptyArray } from "./definition";

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray head
 */
export function head<A>(self: NonEmptyArray<A>): A {
  return self[0];
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray init
 */
export function init<A>(self: NonEmptyArray<A>): Array<A> {
  return self.slice(0, self.length - 1);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray last
 */
export function last<A>(self: NonEmptyArray<A>): A {
  return self[self.length - 1]!;
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray tail
 */
export function tail<A>(self: NonEmptyArray<A>): Array<A> {
  return self.slice(1);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray unappend
 */
export function unappend<A>(self: NonEmptyArray<A>): readonly [Array<A>, A] {
  return [self.init, self.last];
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray unprepend
 */
export function unprepend<A>(self: NonEmptyArray<A>): readonly [A, Array<A>] {
  return [self.head, self.tail];
}
