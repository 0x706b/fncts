/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray head
 */
export function head<A>(self: ReadonlyNonEmptyArray<A>): A {
  return self[0];
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray init
 */
export function init<A>(self: ReadonlyNonEmptyArray<A>): ReadonlyArray<A> {
  return self.slice(0, self.length - 1);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray last
 */
export function last<A>(self: ReadonlyNonEmptyArray<A>): A {
  return self[self.length - 1]!;
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray tail
 */
export function tail<A>(self: ReadonlyNonEmptyArray<A>): ReadonlyArray<A> {
  return self.slice(1);
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray unappend
 */
export function unappend<A>(self: ReadonlyNonEmptyArray<A>): readonly [ReadonlyArray<A>, A] {
  return [self.init, self.last];
}

/**
 * @tsplus getter fncts.collection.immutable.NonEmptyArray unprepend
 */
export function unprepend<A>(self: ReadonlyNonEmptyArray<A>): readonly [A, ReadonlyArray<A>] {
  return [self.head, self.tail];
}
