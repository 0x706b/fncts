import * as P from "../../typeclass.js";
import { Hashable } from "../../typeclass.js";
import { isObject } from "../../util/predicates.js";
import { tuple } from "../function.js";

export const CauseTypeId = Symbol.for("fncts.Cause");
export type CauseTypeId = typeof CauseTypeId;

/**
 * @tsplus type fncts.Cause
 */
export type Cause<E> = Empty | Halt | Interrupt | Fail<E> | Then<E> | Both<E> | Stackless<E>;

/**
 * @tsplus type fncts.CauseOps
 */
export interface CauseOps {}

export const Cause: CauseOps = {};

export function isCause(u: unknown): u is Cause<unknown> {
  return isObject(u) && CauseTypeId in u;
}

export const enum CauseTag {
  Empty = "Empty",
  Fail = "Fail",
  Halt = "Halt",
  Interrupt = "Interrupt",
  Then = "Then",
  Both = "Both",
  Stackless = "Stackless",
}

const _emptyHash = Hashable.string("fncts.Cause");

/**
 * @tsplus companion fncts.Cause.EmptyOps
 */
export class Empty {
  readonly _E!: () => never;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Empty;

  get [Symbol.hash](): number {
    return _emptyHash;
  }
  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && this.equalsEval(that).run;
  }

  equalsEval(that: Cause<unknown>): Eval<boolean> {
    switch (that._tag) {
      case CauseTag.Empty:
        return Eval.now(true);
      case CauseTag.Then:
      case CauseTag.Both:
        return this.equalsEval(that.left).zipWith(this.equalsEval(that.right), (x, y) => x && y);
      case CauseTag.Stackless:
        return this.equalsEval(that.cause);
      default:
        return Eval.now(false);
    }
  }
}

export const _Empty = new Empty();

/**
 * @tsplus companion fncts.Cause.FailOps
 */
export class Fail<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Fail;

  constructor(readonly value: E, readonly trace: Trace) {}

  get [Symbol.hash](): number {
    return Hashable.combine(Hashable.string(this._tag), Hashable.unknown(this.value));
  }
  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && Eval.run(this.equalsEval(that));
  }

  equalsEval(that: Cause<unknown>): Eval<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Eval.gen(function* (_) {
      switch (that._tag) {
        case CauseTag.Fail:
          return P.Equatable.strictEquals(self.value, that.value);
        case CauseTag.Both:
        case CauseTag.Then:
          return yield* _(structuralSymmetric(structuralEqualEmpty)(self, that));
        case CauseTag.Stackless:
          return yield* _(self.equalsEval(that.cause));
        default:
          return false;
      }
    });
  }
}

/**
 * @tsplus companion fncts.Cause.HaltOps
 */
export class Halt {
  readonly _E!: () => never;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Halt;

  constructor(readonly value: unknown, readonly trace: Trace) {}

  get [Symbol.hash](): number {
    return Hashable.combine(Hashable.string(this._tag), Hashable.unknown(this.value));
  }
  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && Eval.run(this.equalsEval(that));
  }

  equalsEval(that: Cause<unknown>): Eval<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Eval.gen(function* (_) {
      switch (that._tag) {
        case CauseTag.Halt:
          return P.Equatable.strictEquals(self.value, that.value);
        case CauseTag.Then:
        case CauseTag.Both:
          return yield* _(structuralSymmetric(structuralEqualEmpty)(self, that));
        case CauseTag.Stackless:
          return yield* _(self.equalsEval(that.cause));
        default:
          return false;
      }
    });
  }
}

/**
 * @tsplus companion fncts.Cause.InterruptOps
 */
export class Interrupt {
  readonly _E!: () => never;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Interrupt;

  constructor(readonly id: FiberId, readonly trace: Trace) {}

  get [Symbol.hash](): number {
    return Hashable.combine(Hashable.string(this._tag), Hashable.unknown(this.id));
  }

  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && Eval.run(this.equalsEval(that));
  }

  equalsEval(that: Cause<unknown>): Eval<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Eval.gen(function* (_) {
      switch (that._tag) {
        case CauseTag.Interrupt:
          return P.Equatable.strictEquals(self.id, that.id);
        case CauseTag.Then:
        case CauseTag.Both:
          return yield* _(structuralSymmetric(structuralEqualEmpty)(self, that));
        case CauseTag.Stackless:
          return yield* _(self.equalsEval(that.cause));
        default:
          return false;
      }
    });
  }
}

/**
 * @tsplus companion fncts.Cause.ThenOps
 */
export class Then<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Then;

  constructor(readonly left: Cause<E>, readonly right: Cause<E>) {}

  get [Symbol.hash](): number {
    return hashCode(this);
  }

  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && Eval.run(this.equalsEval(that));
  }

  equalsEval(that: Cause<unknown>): Eval<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Eval.gen(function* (_) {
      return (
        (yield* _(structuralEqualThen(self, that))) ||
        (yield* _(structuralSymmetric(structuralThenAssociate)(self, that))) ||
        (yield* _(structuralSymmetric(strcturalThenDistribute)(self, that))) ||
        (yield* _(structuralSymmetric(structuralEqualEmpty)(self, that)))
      );
    });
  }
}

/**
 * @tsplus companion fncts.Cause.BothOps
 */
export class Both<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Both;

  constructor(readonly left: Cause<E>, readonly right: Cause<E>) {}

  get [Symbol.hash](): number {
    return hashCode(this);
  }

  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && Eval.run(this.equalsEval(that));
  }

  equalsEval(that: Cause<unknown>): Eval<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Eval.gen(function* (_) {
      return (
        (yield* _(structuralEqualBoth(self, that))) ||
        (yield* _(structuralSymmetric(structuralBothAssociate)(self, that))) ||
        (yield* _(structuralSymmetric(structuralBothDistribute)(self, that))) ||
        (yield* _(structuralSymmetric(structuralEqualEmpty)(self, that)))
      );
    });
  }
}

/**
 * @tsplus companion fncts.Cause.StacklessOps
 */
export class Stackless<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Stackless;

  constructor(readonly cause: Cause<E>, readonly stackless: boolean) {}

  get [Symbol.hash](): number {
    return this.cause[Symbol.hash];
  }

  [Symbol.equals](that: unknown): boolean {
    return isCause(that) && this.cause[Symbol.equals](that);
  }

  equalsEval(that: unknown): Eval<boolean> {
    return Eval.now(this[Symbol.equals](that));
  }
}

export class Unified {
  constructor(readonly fiberId: FiberId, readonly message: ReadonlyArray<string>, readonly trace: Conc<string>) {}
}

/*
 * -------------------------------------------------------------------------------------------------
 * structural equality internals
 * -------------------------------------------------------------------------------------------------
 */

function structuralSymmetric<Id, A>(
  f: (x: Cause<A>, y: Cause<A>) => Eval<boolean>,
): (x: Cause<A>, y: Cause<A>) => Eval<boolean> {
  return (x, y) => f(x, y).zipWith(f(y, x), (a, b) => a || b);
}

function structuralEqualEmpty<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (l._tag === CauseTag.Then || l._tag === CauseTag.Both) {
    if (l.left._tag === CauseTag.Empty) {
      return l.right.equalsEval(r);
    } else if (l.right._tag === CauseTag.Empty) {
      return l.left.equalsEval(r);
    } else {
      return Eval.now(false);
    }
  } else {
    return Eval.now(false);
  }
}

function structuralThenAssociate<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Then &&
    l.left._tag === CauseTag.Then &&
    r._tag === CauseTag.Then &&
    r.right._tag === CauseTag.Then
  ) {
    return l.left.left
      .equalsEval(r.left)
      .and(l.left.right.equalsEval(r.right.left))
      .and(l.right.equalsEval(r.right.right));
  } else {
    return Eval.now(false);
  }
}

function strcturalThenDistribute<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Then &&
    l.right._tag === CauseTag.Both &&
    r._tag === CauseTag.Both &&
    r.right._tag === CauseTag.Then &&
    r.left._tag === CauseTag.Then
  ) {
    return r.left.left
      .equalsEval(r.right.left)
      .and(l.left.equalsEval(r.left.left))
      .and(l.right.left.equalsEval(r.left.right))
      .and(l.right.right.equalsEval(r.right.right));
  } else if (
    l._tag === CauseTag.Then &&
    l.left._tag === CauseTag.Both &&
    r._tag === CauseTag.Both &&
    r.left._tag === CauseTag.Then &&
    r.right._tag === CauseTag.Then
  ) {
    return r.left.right
      .equalsEval(r.right.right)
      .and(l.left.left.equalsEval(r.left.left))
      .and(l.left.right.equalsEval(r.right.left))
      .and(l.right.equalsEval(r.left.right));
  } else {
    return Eval.now(false);
  }
}

function structuralEqualThen<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (l._tag === CauseTag.Then && r._tag === CauseTag.Then) {
    return l.left.equalsEval(r.left).zipWith(l.right.equalsEval(r.right), (a, b) => a && b);
  } else {
    return Eval.now(false);
  }
}

function structuralBothAssociate<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Both &&
    l.left._tag === CauseTag.Both &&
    r._tag === CauseTag.Both &&
    r.right._tag === CauseTag.Both
  ) {
    return l.left.left
      .equalsEval(r.left)
      .and(l.left.right.equalsEval(r.right.left))
      .and(l.right.equalsEval(r.right.right));
  } else {
    return Eval.now(false);
  }
}

function structuralBothDistribute<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Both &&
    l.left._tag === CauseTag.Then &&
    l.right._tag === CauseTag.Then &&
    r._tag === CauseTag.Then &&
    r.right._tag === CauseTag.Both
  ) {
    return l.left.left
      .equalsEval(l.right.left)
      .and(l.left.left.equalsEval(r.left))
      .and(l.left.right.equalsEval(r.right.left))
      .and(l.right.right.equalsEval(r.right.right));
  } else if (
    l._tag === CauseTag.Both &&
    l.left._tag === CauseTag.Then &&
    l.right._tag === CauseTag.Then &&
    r._tag === CauseTag.Then &&
    r.left._tag === CauseTag.Both
  ) {
    return l.left.right
      .equalsEval(l.right.right)
      .and(l.left.left.equalsEval(r.left.left))
      .and(l.right.left.equalsEval(r.left.right))
      .and(l.left.right.equalsEval(r.right));
  } else {
    return Eval.now(false);
  }
}

function structuralEqualBoth<A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (l._tag === CauseTag.Both && r._tag === CauseTag.Both) {
    return l.left.equalsEval(r.left).zipWith(l.right.equalsEval(r.right), (a, b) => a && b);
  } else {
    return Eval.now(false);
  }
}

/*
 * -------------------------------------------------------------------------------------------------
 * hash internals
 * -------------------------------------------------------------------------------------------------
 */

function stepLoop<A>(
  cause: Cause<A>,
  stack: List<Cause<A>>,
  parallel: HashSet<Cause<A>>,
  sequential: List<Cause<A>>,
): readonly [HashSet<Cause<A>>, List<Cause<A>>] {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    /* eslint-disable no-param-reassign */
    switch (cause._tag) {
      case CauseTag.Empty: {
        if (stack.isEmpty()) {
          return tuple(parallel, sequential);
        } else {
          cause = stack.unsafeHead;
          stack = stack.unsafeTail;
        }
        break;
      }
      case CauseTag.Then: {
        const left  = cause.left;
        const right = cause.right;
        switch (left._tag) {
          case CauseTag.Empty: {
            cause = right;
            break;
          }
          case CauseTag.Then: {
            cause = new Then(left.left, new Then(left.right, right));
            break;
          }
          case CauseTag.Both: {
            cause = new Both(new Then(left.left, right), new Then(left.right, right));
            break;
          }
          default: {
            cause      = left;
            sequential = sequential.prepend(right);
          }
        }
        break;
      }
      case CauseTag.Both: {
        stack = stack.prepend(cause.right);
        cause = cause.left;
        break;
      }
      default: {
        if (stack.isEmpty()) {
          return tuple(parallel.add(cause), sequential);
        } else {
          cause    = stack.unsafeHead;
          stack    = stack.unsafeTail;
          parallel = parallel.add(cause);
          break;
        }
      }
    }
  }
  throw new Error("BUG");
  /* eslint-enable no-param-reassign */
}

function step<A>(cause: Cause<A>): readonly [HashSet<Cause<A>>, List<Cause<A>>] {
  return stepLoop(cause, Nil(), HashSet.empty(), Nil());
}

function flattenLoop<A>(causes: List<Cause<A>>, flattened: List<HashSet<Cause<A>>>): List<HashSet<Cause<A>>> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    const [parallel, sequential] = causes.foldLeft(
      tuple(HashSet.empty<Cause<A>>(), List.empty<Cause<A>>()),
      ([parallel, sequential], cause) => {
        const [set, seq] = step(cause);
        return tuple(parallel.union(set), sequential.concat(seq));
      },
    );
    const updated = parallel.size > 0 ? flattened.prepend(parallel) : flattened;
    if (sequential.isEmpty()) {
      return updated.reverse;
    } else {
      /* eslint-disable no-param-reassign */
      causes    = sequential;
      flattened = updated;
      /* eslint-enable no-param-reassign */
    }
  }
  throw new Error("BUG");
}

function flat<A>(cause: Cause<A>): List<HashSet<Cause<A>>> {
  return flattenLoop(Cons(cause, List.empty()), List.empty());
}

function hashCode<A>(cause: Cause<A>): number {
  const flattened = flat(cause);
  const size      = flattened.length;
  let head;
  if (size === 0) {
    return _emptyHash;
  } else if (size === 1 && (head = flattened.unsafeHead) && head.size === 1) {
    return List.from(head).unsafeHead[Symbol.hash];
  } else {
    return Hashable.iterator(flattened[Symbol.iterator]());
  }
}
