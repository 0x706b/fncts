/**
 * @tsplus getter fncts.ImmutableNonEmptyArray head
 */
export function head<A>(self: ImmutableNonEmptyArray<A>): A {
  return self._array[0];
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray init
 */
export function init<A>(self: ImmutableNonEmptyArray<A>): ImmutableArray<A> {
  return self.slice(0, self.length - 1);
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray last
 */
export function last<A>(self: ImmutableNonEmptyArray<A>): A {
  return self._array[self.length - 1]!;
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray tail
 */
export function tail<A>(self: ImmutableNonEmptyArray<A>): ImmutableArray<A> {
  return self.slice(1);
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray unappend
 */
export function unappend<A>(self: ImmutableNonEmptyArray<A>): readonly [ImmutableArray<A>, A] {
  return [self.init, self.last];
}

/**
 * @tsplus getter fncts.ImmutableNonEmptyArray unprepend
 */
export function unprepend<A>(self: ImmutableNonEmptyArray<A>): readonly [A, ImmutableArray<A>] {
  return [self.head, self.tail];
}
