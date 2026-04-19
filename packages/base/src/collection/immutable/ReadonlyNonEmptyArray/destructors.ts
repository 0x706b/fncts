/**
 * Returns the first element.
 *
 * @tsplus getter fncts.ReadonlyNonEmptyArray head
 */
export function head<A>(self: ReadonlyNonEmptyArray<A>): A {
  return self[0];
}

/**
 * Returns all elements except the last.
 *
 * @tsplus getter fncts.ReadonlyNonEmptyArray init
 */
export function init<A>(self: ReadonlyNonEmptyArray<A>): ReadonlyArray<A> {
  return self.slice(0, self.length - 1);
}

/**
 * Returns the last element.
 *
 * @tsplus getter fncts.ReadonlyNonEmptyArray last
 */
export function last<A>(self: ReadonlyNonEmptyArray<A>): A {
  return self[self.length - 1]!;
}

/**
 * Returns all elements except the first.
 *
 * @tsplus getter fncts.ReadonlyNonEmptyArray tail
 */
export function tail<A>(self: ReadonlyNonEmptyArray<A>): ReadonlyArray<A> {
  return self.slice(1);
}

/**
 * Splits into the initial segment and the last element.
 *
 * @tsplus getter fncts.ReadonlyNonEmptyArray unappend
 */
export function unappend<A>(self: ReadonlyNonEmptyArray<A>): readonly [ReadonlyArray<A>, A] {
  return [self.init, self.last];
}

/**
 * Splits into the first element and the remaining tail.
 *
 * @tsplus getter fncts.ReadonlyNonEmptyArray unprepend
 */
export function unprepend<A>(self: ReadonlyNonEmptyArray<A>): readonly [A, ReadonlyArray<A>] {
  return [self.head, self.tail];
}
