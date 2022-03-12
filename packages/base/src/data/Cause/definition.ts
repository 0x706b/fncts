import type { Conc } from "../../collection/immutable/Conc.js";
import type { FiberId } from "../FiberId.js";
import type { Trace } from "../Trace.js";

import { HashSet } from "../../collection/immutable/HashSet.js";
import { Cons, List, Nil } from "../../collection/immutable/List.js";
import { Eval } from "../../control/Eval.js";
import * as P from "../../prelude.js";
import { Hashable } from "../../prelude.js";
import { isObject } from "../../util/predicates.js";
import { tuple } from "../function.js";

export const CauseTypeId = Symbol.for("fncts.data.Cause");
export type CauseTypeId = typeof CauseTypeId;

/**
 * @tsplus type fncts.data.Cause
 */
export type Cause<E> = Empty | Halt | Interrupt | Fail<E> | Then<E> | Both<E> | Stackless<E>;

/**
 * @tsplus type fncts.data.CauseOps
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

const _emptyHash = P.Hashable.hashString("fncts.data.Cause");

/**
 * @tsplus companion fncts.data.Cause.EmptyOps
 */
export class Empty {
  readonly _E!: () => never;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Empty;

  get [Symbol.hashable](): number {
    return _emptyHash;
  }
  [Symbol.equatable](that: unknown): boolean {
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
 * @tsplus companion fncts.data.Cause.FailOps
 */
export class Fail<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Fail;

  constructor(readonly value: E, readonly trace: Trace) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(P.Hashable.hash(this._tag), P.Hashable.hash(this.value));
  }
  [Symbol.equatable](that: unknown): boolean {
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
 * @tsplus companion fncts.data.Cause.HaltOps
 */
export class Halt {
  readonly _E!: () => never;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Halt;

  constructor(readonly value: unknown, readonly trace: Trace) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(P.Hashable.hash(this._tag), P.Hashable.hash(this.value));
  }
  [Symbol.equatable](that: unknown): boolean {
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
 * @tsplus companion fncts.data.Cause.InterruptOps
 */
export class Interrupt {
  readonly _E!: () => never;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Interrupt;

  constructor(readonly id: FiberId, readonly trace: Trace) {}

  get [Symbol.hashable](): number {
    return P.Hashable.combineHash(P.Hashable.hash(this._tag), P.Hashable.hash(this.id));
  }

  [Symbol.equatable](that: unknown): boolean {
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
 * @tsplus companion fncts.data.Cause.ThenOps
 */
export class Then<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Then;

  constructor(readonly left: Cause<E>, readonly right: Cause<E>) {}

  get [Symbol.hashable](): number {
    return hashCode(this);
  }

  [Symbol.equatable](that: unknown): boolean {
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
 * @tsplus companion fncts.data.Cause.BothOps
 */
export class Both<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Both;

  constructor(readonly left: Cause<E>, readonly right: Cause<E>) {}

  get [Symbol.hashable](): number {
    return hashCode(this);
  }

  [Symbol.equatable](that: unknown): boolean {
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
 * @tsplus companion fncts.data.Cause.StacklessOps
 */
export class Stackless<E> {
  readonly _E!: () => E;

  readonly [CauseTypeId]: CauseTypeId = CauseTypeId;
  readonly _tag = CauseTag.Stackless;

  constructor(readonly cause: Cause<E>, readonly stackless: boolean) {}

  get [Symbol.hashable](): number {
    return this.cause[Symbol.hashable];
  }

  [Symbol.equatable](that: unknown): boolean {
    return isCause(that) && this.cause[Symbol.equatable](that);
  }

  equalsEval(that: unknown): Eval<boolean> {
    return Eval.now(this[Symbol.equatable](that));
  }
}

export class Unified {
  constructor(
    readonly fiberId: FiberId,
    readonly message: ReadonlyArray<string>,
    readonly trace: Conc<string>,
  ) {}
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

function structuralEqualEmpty<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
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

function structuralThenAssociate<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Then &&
    l.left._tag === CauseTag.Then &&
    r._tag === CauseTag.Then &&
    r.right._tag === CauseTag.Then
  ) {
    return Eval.sequenceArray([
      l.left.left.equalsEval(r.left),
      l.left.right.equalsEval(r.right.left),
      l.right.equalsEval(r.right.right),
    ]).map((bs) => bs.foldLeft(true as boolean, (b, a) => b && a));
  } else {
    return Eval.now(false);
  }
}

function strcturalThenDistribute<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Then &&
    l.right._tag === CauseTag.Both &&
    r._tag === CauseTag.Both &&
    r.right._tag === CauseTag.Then &&
    r.left._tag === CauseTag.Then
  ) {
    return Eval.sequenceArray([
      r.left.left.equalsEval(r.right.left),
      l.left.equalsEval(r.left.left),
      l.right.left.equalsEval(r.left.right),
      l.right.right.equalsEval(r.right.right),
    ]).map((bs) => bs.foldLeft(true as boolean, (b, a) => b && a));
  } else if (
    l._tag === CauseTag.Then &&
    l.left._tag === CauseTag.Both &&
    r._tag === CauseTag.Both &&
    r.left._tag === CauseTag.Then &&
    r.right._tag === CauseTag.Then
  ) {
    return Eval.sequenceArray([
      r.left.right.equalsEval(r.right.right),
      l.left.left.equalsEval(r.left.left),
      l.left.right.equalsEval(r.right.left),
      l.right.equalsEval(r.left.right),
    ]).map((bs) => bs.foldLeft(true as boolean, (b, a) => b && a));
  } else {
    return Eval.now(false);
  }
}

function structuralEqualThen<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (l._tag === CauseTag.Then && r._tag === CauseTag.Then) {
    return l.left.equalsEval(r.left).zipWith(l.right.equalsEval(r.right), (a, b) => a && b);
  } else {
    return Eval.now(false);
  }
}

function structuralBothAssociate<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Both &&
    l.left._tag === CauseTag.Both &&
    r._tag === CauseTag.Both &&
    r.right._tag === CauseTag.Both
  ) {
    return Eval.sequenceArray([
      l.left.left.equalsEval(r.left),
      l.left.right.equalsEval(r.right.left),
      l.right.equalsEval(r.right.right),
    ]).map((bs) => bs.foldLeft(true as boolean, (b, a) => b && a));
  } else {
    return Eval.now(false);
  }
}

function structuralBothDistribute<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
  if (
    l._tag === CauseTag.Both &&
    l.left._tag === CauseTag.Then &&
    l.right._tag === CauseTag.Then &&
    r._tag === CauseTag.Then &&
    r.right._tag === CauseTag.Both
  ) {
    return Eval.sequenceArray([
      l.left.left.equalsEval(l.right.left),
      l.left.left.equalsEval(r.left),
      l.left.right.equalsEval(r.right.left),
      l.right.right.equalsEval(r.right.right),
    ]).map((bs) => bs.foldLeft(true as boolean, (b, a) => b && a));
  } else if (
    l._tag === CauseTag.Both &&
    l.left._tag === CauseTag.Then &&
    l.right._tag === CauseTag.Then &&
    r._tag === CauseTag.Then &&
    r.left._tag === CauseTag.Both
  ) {
    return Eval.sequenceArray([
      l.left.right.equalsEval(l.right.right),
      l.left.left.equalsEval(r.left.left),
      l.right.left.equalsEval(r.left.right),
      l.left.right.equalsEval(r.right),
    ]).map((bs) => bs.foldLeft(true as boolean, (b, a) => b && a));
  } else {
    return Eval.now(false);
  }
}

function structuralEqualBoth<Id, A>(l: Cause<A>, r: Cause<A>): Eval<boolean> {
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

function stepLoop<Id, A>(
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

function step<Id, A>(cause: Cause<A>): readonly [HashSet<Cause<A>>, List<Cause<A>>] {
  return stepLoop(cause, Nil(), HashSet.makeDefault(), Nil());
}

function flattenLoop<Id, A>(
  causes: List<Cause<A>>,
  flattened: List<HashSet<Cause<A>>>,
): List<HashSet<Cause<A>>> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    const [parallel, sequential] = causes.foldLeft(
      tuple(HashSet.makeDefault<Cause<A>>(), List.empty<Cause<A>>()),
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

function flat<Id, A>(cause: Cause<A>): List<HashSet<Cause<A>>> {
  return flattenLoop(Cons(cause, List.empty()), List.empty());
}

function hashCode<Id, A>(cause: Cause<A>): number {
  const flattened = flat(cause);
  const size      = flattened.length;
  let head;
  if (size === 0) {
    return _emptyHash;
  } else if (size === 1 && (head = flattened.unsafeHead) && head.size === 1) {
    return List.from(head).unsafeHead[Symbol.hashable];
  } else {
    return Hashable.hashIterator(flattened[Symbol.iterator]());
  }
}
