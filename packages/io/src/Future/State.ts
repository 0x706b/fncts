export type FutureState<E, A> = Done<E, A> | Pending<E, A>;

export const enum FutureStateTag {
  Link,
  Empty,
  Done,
}

export abstract class Pending<E, A> {
  abstract size: number;
  abstract complete(io: FIO<E, A>): void;
  abstract add(waiter: (io: FIO<E, A>) => any): Pending<E, A>;
  abstract remove(waiter: (io: FIO<E, A>) => any): Pending<E, A>;
}

export type Concrete<E, A> = Empty | Link<E, A> | Done<E, A>;
export type ConcretePending<E, A> = Empty | Link<E, A>;

/**
 * @tsplus fluent fncts.io.Future.State concrete
 * @tsplus macro remove
 */
export function concrete<E, A>(self: State<E, A>): asserts self is Concrete<E, A> {}

/**
 * @tsplus fluent fncts.io.Future.State concretePending
 * @tsplus macro remove
 */
export function concretePending<E, A>(self: Pending<E, A>): asserts self is ConcretePending<E, A> {}

export class Empty extends Pending<never, never> {
  readonly _tag = FutureStateTag.Empty;
  size: number  = 0;
  complete(_: FIO<never, never>): void {
    return;
  }
  add(waiter: (io: FIO<never, never>) => any): Pending<never, never> {
    return new Link(waiter, this, 1);
  }
  remove(_: (io: FIO<never, never>) => any): Pending<never, never> {
    return this;
  }
}

/**
 * @tsplus static fncts.io.Future.State Empty
 */
export const _Empty = new Empty();

export class Link<E, A> extends Pending<E, A> {
  readonly _tag = FutureStateTag.Link;

  constructor(
    readonly waiter: (io: FIO<E, A>) => any,
    readonly ws: Pending<E, A>,
    readonly size: number,
  ) {
    super();
  }

  add(waiter: (io: FIO<E, A>) => any): Pending<E, A> {
    return new Link(waiter, this, this.size + 1);
  }

  complete(io: FIO<E, A>): void {
    if (this.size === 1) {
      return this.waiter(io);
    } else {
      let current = this as ConcretePending<E, A>;

      while (current._tag !== FutureStateTag.Empty) {
        current.waiter(io);
        current = current.ws as ConcretePending<E, A>;
      }
    }
  }

  remove(waiter: (io: FIO<E, A>) => any): Pending<E, A> {
    if (this.size === 1) {
      if (waiter === this.waiter) {
        return this.ws;
      } else {
        return this;
      }
    } else {
      const arr              = materialize(this, this.size);
      let i                  = this.size - 1;
      let acc: Pending<E, A> = State.Empty;

      while (i >= 0) {
        if (arr[i] !== this.waiter) {
          acc = acc.add(arr[i]) as Pending<E, A>;
        }
        i -= 1;
      }

      return acc;
    }
  }
}

function materialize<E, A>(self: Pending<E, A>, size: number): Array<(io: FIO<E, A>) => any> {
  const array = new Array<(io: FIO<E, A>) => any>(size);
  let current = self;
  let i       = size - 1;

  while (i >= 0) {
    concretePending(current);
    if (current._tag === FutureStateTag.Link) {
      array[i] = current.waiter;
      current  = current.ws;
    }
    i -= 1;
  }

  return array;
}

export class Done<E, A> {
  readonly _tag = FutureStateTag.Done;
  constructor(readonly value: FIO<E, A>) {}
}

/**
 * @tsplus type fncts.io.Future.State
 * @tsplus companion fncts.io.Future.State
 */
export type State<E, A> = Done<E, A> | Pending<E, A>;
