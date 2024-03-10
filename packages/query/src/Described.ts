/**
 * A `Described<A>` is a value of type `A` along with a string description of
 * that value. The description may be used to generate a hash associated with
 * the value, so values that are equal should have the same description and
 * values that are not equal should have different descriptions.
 *
 * @tsplus type fncts.query.Described
 * @tsplus companion fncts.query.DescribedOps
 */
export class Described<A> {
  constructor(
    readonly value: A,
    readonly description: string,
  ) {}
}

/**
 * @tsplus pipeable global described
 */
export function described(description: string) {
  return <A>(value: A): Described<A> => {
    return new Described(value, description);
  };
}
