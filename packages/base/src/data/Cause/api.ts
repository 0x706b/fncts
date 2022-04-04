import { Stack } from "../../internal/Stack.js";
import { identity } from "../function.js";
import {
  _Empty,
  Both,
  Cause,
  CauseTag,
  Empty,
  Fail,
  Halt,
  Interrupt,
  Stackless,
  Then,
} from "./definition.js";

/**
 * @tsplus fluent fncts.data.Cause as
 */
export function as_<A, B>(self: Cause<A>, b: Lazy<B>): Cause<B> {
  return self.map(() => b());
}

/**
 * @internal
 */
function chainEval<E, D>(self: Cause<E>, f: (e: E) => Cause<D>): Eval<Cause<D>> {
  switch (self._tag) {
    case CauseTag.Empty:
      return Eval.now(Cause.empty());
    case CauseTag.Fail:
      return Eval.now(Cause.traced(f(self.value), self.trace));
    case CauseTag.Halt:
      return Eval.now(self);
    case CauseTag.Interrupt:
      return Eval.now(self);
    case CauseTag.Then:
      return Eval.defer(() => chainEval(self.left, f)).zipWith(
        Eval.defer(() => chainEval(self.right, f)),
        Cause.then,
      );
    case CauseTag.Both:
      return Eval.defer(() => chainEval(self.left, f)).zipWith(
        Eval.defer(() => chainEval(self.right, f)),
        Cause.both,
      );
    case CauseTag.Stackless:
      return Eval.defer(chainEval(self.cause, f));
  }
}

/**
 * Constructs a `Cause` from two `Cause`s, representing parallel failures.
 *
 * @note If one of the `Cause`s is `Empty`, the non-empty `Cause` is returned
 *
 * @tsplus static fncts.data.CauseOps both
 * @tsplus static fncts.data.Cause.BothOps __call
 */
export function both<E, E1>(left: Cause<E>, right: Cause<E1>): Cause<E | E1> {
  return left.isEmpty ? right : right.isEmpty ? left : new Both<E | E1>(left, right);
}

/**
 * Composes computations in sequence, using the return value of one computation as input for the next
 *
 * @tsplus fluent fncts.data.Cause chain
 */
export function chain_<E, D>(self: Cause<E>, f: (e: E) => Cause<D>): Cause<D> {
  return Eval.run(chainEval(self, f));
}

/**
 * Determines whether a `Cause` contains or is equal to the specified cause.
 *
 * @tsplus fluent fncts.data.Cause contains
 */
export function contains_<E, E1 extends E = E>(self: Cause<E>, that: Cause<E1>): boolean {
  return Eval.run(containsEval(self, that));
}

/**
 * @internal
 */
function containsEval<E, E1 extends E = E>(self: Cause<E>, that: Cause<E1>): Eval<boolean> {
  return Eval.gen(function* (_) {
    if (yield* _(self.equalsEval(that))) {
      return true;
    }
    return yield* _(
      self.foldLeft(Eval.now(false), (computation, c) =>
        Just(computation.chain((b) => (b ? Eval.now(b) : c.equalsEval(that)))),
      ),
    );
  });
}

/**
 * Extracts a list of non-recoverable errors from the `Cause`.
 *
 * @tsplus getter fncts.data.Cause defects
 */
export function defects<E>(self: Cause<E>): ReadonlyArray<unknown> {
  return self.foldLeft([] as ReadonlyArray<unknown>, (a, c) =>
    c._tag === CauseTag.Halt ? Just([...a, c.value]) : Nothing(),
  );
}

/**
 * The empty `Cause`
 *
 * @tsplus static fncts.data.CauseOps empty
 * @tsplus static fncts.data.Cause.EmptyOps __call
 */
export function empty<A>(): Cause<A> {
  return _Empty;
}

/**
 * Constructs a `Cause` from a single value, representing a typed failure
 *
 * @tsplus static fncts.data.CauseOps fail
 * @tsplus static fncts.data.Cause.FailOps __call
 */
export function fail<E = never>(value: E, trace: Trace = Trace.none): Cause<E> {
  return new Fail(value, trace);
}

/**
 * Determines whether a `Cause` contains a failure
 *
 * @tsplus getter Cause failed
 */
export function failed<E>(self: Cause<E>): boolean {
  return self.failureMaybe.match(
    () => false,
    () => true,
  );
}

/**
 * Produces a list of all recoverable errors `E` in the `Cause`.
 *
 * @tsplus getter fncts.data.Cause failures
 */
export function failures<E>(self: Cause<E>): ReadonlyArray<E> {
  return self.foldLeft([] as readonly E[], (a, c) =>
    c._tag === CauseTag.Fail ? Just(a.append(c.value)) : Nothing(),
  );
}

/**
 * Retrieve the first checked error on the `Left` if available,
 * if there are no checked errors return the rest of the `Cause`
 * that is known to contain only `Halt` or `Interrupt` causes.
 *
 * @tsplus getter fncts.data.Cause failureOrCause
 */
export function failureOrCause<E>(self: Cause<E>): Either<E, Cause<never>> {
  return self.failureMaybe.match(() => Either.right(self as Cause<never>), Either.left);
}

/**
 * Returns the `E` associated with the first `Fail` in this `Cause` if one
 * exists, along with its (optional) trace.
 *
 * @tsplus getter fncts.data.Cause failureTraceMaybe
 */
export function failureTraceMaybe<E>(self: Cause<E>): Maybe<readonly [E, Trace]> {
  return self.find((c) => (isFail(c) ? Maybe.just([c.value, c.trace]) : Maybe.nothing()));
}

/**
 * Retrieve the first checked error and its trace on the `Left` if available,
 * if there are no checked errors return the rest of the `Cause`
 * that is known to contain only `Halt` or `Interrupt` causes.
 *
 * @tsplus getter fncts.data.Cause failureTraceOrCause
 */
export function failureTraceOrCause<E>(self: Cause<E>): Either<readonly [E, Trace], Cause<never>> {
  return self.failureTraceMaybe.match(() => Either.right(self as Cause<never>), Either.left);
}

/**
 * Returns the `E` associated with the first `Fail` in this `Cause` if one exists.
 *
 * @tsplus getter fncts.data.Cause failureMaybe
 */
export function failureMaybe<E>(self: Cause<E>): Maybe<E> {
  return self.find((c) => (c._tag === CauseTag.Fail ? Maybe.just(c.value) : Maybe.nothing()));
}

/**
 * Remove all `Halt` causes that the specified partial function is defined at,
 * returning `Just` with the remaining causes or `Nothing` if there are no
 * remaining causes.
 *
 * @tsplus fluent fncts.data.Cause filterDefects
 */
export function filterDefects_<E>(self: Cause<E>, p: Predicate<unknown>): Maybe<Cause<E>> {
  return self.fold({
    Empty: () => Just(Empty()),
    Fail: (e, trace) => Just(Fail(e, trace)),
    Halt: (u, trace) => (p(u) ? Nothing() : Just(Halt(u, trace))),
    Interrupt: (fiberId, trace) => Just(Interrupt(fiberId, trace)),
    Then: (l, r) => {
      if (l.isJust() && r.isJust()) {
        return Just(Then(l.value, r.value));
      } else if (l.isJust() && r.isNothing()) {
        return Just(l.value);
      } else if (l.isNothing() && r.isJust()) {
        return Just(r.value);
      } else {
        return Nothing();
      }
    },
    Both: (l, r) => {
      if (l.isJust() && r.isJust()) {
        return Just(Both(l.value, r.value));
      } else if (l.isJust() && r.isNothing()) {
        return Just(l.value);
      } else if (l.isNothing() && r.isJust()) {
        return Just(r.value);
      } else {
        return Nothing();
      }
    },
    Stackless: (causeOption, stackless) => causeOption.map((cause) => Stackless(cause, stackless)),
  });
}

/**
 * @tsplus tailRec
 */
function findLoop<A, B>(
  self: Cause<A>,
  f: (cause: Cause<A>) => Maybe<B>,
  stack: List<Cause<A>>,
): Maybe<B> {
  const r = f(self);
  switch (r._tag) {
    case MaybeTag.Nothing: {
      switch (self._tag) {
        case CauseTag.Both:
        case CauseTag.Then: {
          return findLoop(self.left, f, stack.prepend(self.right));
        }
        default: {
          if (stack.isNonEmpty()) {
            return findLoop(stack.unsafeHead, f, stack.unsafeTail);
          }
          return Nothing();
        }
      }
    }
    case MaybeTag.Just: {
      return r;
    }
  }
}

/**
 * Finds the first result matching `f`
 *
 * @tsplus fluent fncts.data.Cause find
 */
export function find_<E, A>(self: Cause<E>, f: (cause: Cause<E>) => Maybe<A>): Maybe<A> {
  return findLoop(self, f, Nil());
}

/**
 * @tsplus getter fncts.data.Cause flatten
 */
export function flatten<A>(self: Cause<Cause<A>>): Cause<A> {
  return self.chain(identity);
}

class FCEStackFrameDone {
  readonly _tag = "FCEStackFrameDone";
}

class FCEStackFrameThenLeft<E, A> {
  readonly _tag = "FCEStackFrameThenLeft";

  constructor(readonly cause: Then<Either<E, A>>) {}
}

class FCEStackFrameThenRight<E, A> {
  readonly _tag = "FCEStackFrameThenRight";

  constructor(readonly cause: Then<Either<E, A>>, readonly leftResult: Either<Cause<E>, A>) {}
}

class FCEStackFrameBothLeft<E, A> {
  readonly _tag = "FCEStackFrameBothLeft";

  constructor(readonly cause: Both<Either<E, A>>) {}
}

class FCEStackFrameBothRight<E, A> {
  readonly _tag = "FCEStackFrameBothRight";

  constructor(readonly cause: Both<Either<E, A>>, readonly leftResult: Either<Cause<E>, A>) {}
}

type FCEStackFrame<E, A> =
  | FCEStackFrameDone
  | FCEStackFrameThenLeft<E, A>
  | FCEStackFrameThenRight<E, A>
  | FCEStackFrameBothLeft<E, A>
  | FCEStackFrameBothRight<E, A>;

/**
 * Converts the specified `Cause<Either<E, A>>` to an `Either<Cause<E>, A>` by
 * recursively stripping out any failures with the error `Nothing`.
 *
 * @tsplus getter fncts.data.Cause flipCauseEither
 */
export function flipCauseEither<E, A>(self: Cause<Either<E, A>>): Either<Cause<E>, A> {
  let stack: Stack<FCEStackFrame<E, A>> = Stack.make(new FCEStackFrameDone());
  let result: Either<Cause<E>, A> | undefined;
  let c = self;

  recursion: while (stack) {
    // eslint-disable-next-line no-constant-condition
    pushing: while (true) {
      switch (c._tag) {
        case CauseTag.Empty:
          result = Either.left(Cause.empty());
          break pushing;
        case CauseTag.Interrupt:
          result = Either.left(Cause.interrupt(c.id, c.trace));
          break pushing;
        case CauseTag.Halt:
          result = Either.left(c);
          break pushing;
        case CauseTag.Fail:
          result = c.value.match(
            (l) => Either.left(Cause.fail(l, Trace.none)),
            (r) => Either.right(r),
          );
          break pushing;
        case CauseTag.Then:
          stack = Stack.make(new FCEStackFrameThenLeft(c), stack);
          c     = c.left;
          continue pushing;
        case CauseTag.Both:
          stack = Stack.make(new FCEStackFrameBothLeft(c), stack);
          c     = c.left;
          continue pushing;
      }
    }

    // eslint-disable-next-line no-constant-condition
    popping: while (true) {
      const top = stack.value;

      stack = stack.previous!;

      switch (top._tag) {
        case "FCEStackFrameDone":
          return result;
        case "FCEStackFrameThenLeft":
          c     = top.cause.right;
          stack = Stack.make(new FCEStackFrameThenRight(top.cause, result), stack);
          continue recursion;
        case "FCEStackFrameThenRight": {
          const l = top.leftResult;

          if (l.isLeft() && result.isLeft()) {
            result = Either.left(Cause.then(l.left, result.left));
          }

          if (l.isRight()) {
            result = Either.right(l.right);
          }

          if (result.isRight()) {
            result = Either.right(result.right);
          }

          continue popping;
        }
        case "FCEStackFrameBothLeft":
          c     = top.cause.right;
          stack = Stack.make(new FCEStackFrameBothRight(top.cause, result), stack);
          continue recursion;
        case "FCEStackFrameBothRight": {
          const l = top.leftResult;

          if (l.isLeft() && result.isLeft()) {
            result = Either.left(Cause.both(l.left, result.left));
          }

          if (l.isRight()) {
            result = Either.right(l.right);
          }

          if (result.isRight()) {
            result = Either.right(result.right);
          }

          continue popping;
        }
      }
    }
  }

  throw new Error("Bug");
}

class FCOStackFrameDone {
  readonly _tag = "FCOStackFrameDone";
}

class FCOStackFrameThenLeft<E> {
  readonly _tag = "FCOStackFrameThenLeft";

  constructor(readonly cause: Then<Maybe<E>>) {}
}

class FCOStackFrameThenRight<E> {
  readonly _tag = "FCOStackFrameThenRight";

  constructor(readonly cause: Then<Maybe<E>>, readonly leftResult: Maybe<Cause<E>>) {}
}

class FCOStackFrameBothLeft<E> {
  readonly _tag = "FCOStackFrameBothLeft";

  constructor(readonly cause: Both<Maybe<E>>) {}
}

class FCOStackFrameBothRight<E> {
  readonly _tag = "FCOStackFrameBothRight";

  constructor(readonly cause: Both<Maybe<E>>, readonly leftResult: Maybe<Cause<E>>) {}
}

type FCOStackFrame<E> =
  | FCOStackFrameDone
  | FCOStackFrameThenLeft<E>
  | FCOStackFrameThenRight<E>
  | FCOStackFrameBothLeft<E>
  | FCOStackFrameBothRight<E>;

/**
 * Converts the specified `Cause<Maybe<A>>` to an `Maybe<Cause<A>>` by
 * recursively stripping out any failures with the error `Nothing`.
 *
 * @tsplus getter fncts.data.Cause flipCauseMaybe
 */
export function flipCauseOption<E>(self: Cause<Maybe<E>>): Maybe<Cause<E>> {
  let stack: Stack<FCOStackFrame<E>> = Stack.make(new FCOStackFrameDone());
  let result: Maybe<Cause<E>> | undefined;
  let c = self;

  recursion: while (stack) {
    // eslint-disable-next-line no-constant-condition
    pushing: while (true) {
      switch (c._tag) {
        case CauseTag.Empty:
          result = Just(Cause.empty());
          break pushing;
        case CauseTag.Interrupt:
          result = Just(Cause.interrupt(c.id, Trace.none));
          break pushing;
        case CauseTag.Halt:
          result = Just(c);
          break pushing;
        case CauseTag.Fail:
          result = c.value.match(
            () => Nothing(),
            (r) => Just(Cause.fail(r, Trace.none)),
          );
          break pushing;
        case CauseTag.Then:
          stack = Stack.make(new FCOStackFrameThenLeft(c), stack);
          c     = c.left;
          continue pushing;
        case CauseTag.Both:
          stack = Stack.make(new FCOStackFrameBothLeft(c), stack);
          c     = c.left;
          continue pushing;
      }
    }

    // eslint-disable-next-line no-constant-condition
    popping: while (true) {
      const top = stack.value;

      stack = stack.previous!;

      switch (top._tag) {
        case "FCOStackFrameDone":
          return result;
        case "FCOStackFrameThenLeft":
          c     = top.cause.right;
          stack = Stack.make(new FCOStackFrameThenRight(top.cause, result), stack);
          continue recursion;
        case "FCOStackFrameThenRight": {
          const l = top.leftResult;

          if (l.isJust() && result.isJust()) {
            result = Just(Cause.then(l.value, result.value));
          }

          if (l.isNothing() && result.isJust()) {
            result = Just(result.value);
          }

          if (l.isJust() && result.isNothing()) {
            result = Just(l.value);
          }

          result = Nothing();

          continue popping;
        }
        case "FCOStackFrameBothLeft":
          c     = top.cause.right;
          stack = Stack.make(new FCOStackFrameBothRight(top.cause, result), stack);
          continue recursion;
        case "FCOStackFrameBothRight": {
          const l = top.leftResult;

          if (l.isJust() && result.isJust()) {
            result = Just(Cause.both(l.value, result.value));
          }

          if (l.isNothing() && result.isJust()) {
            result = Just(result.value);
          }

          if (l.isJust() && result.isNothing()) {
            result = Just(l.value);
          }

          result = Nothing();

          continue popping;
        }
      }
    }
  }

  throw new Error("Bug");
}

/**
 * Accumulates a state over a `Cause`
 *
 * @tsplus fluent fncts.data.Cause foldLeft
 */
export function foldLeft_<A, B>(self: Cause<A>, b: B, f: (b: B, cause: Cause<A>) => Maybe<B>): B {
  return foldLeftLoop(self, b, f, Nil());
}

/**
 * @internal
 * @tsplus tailRec
 */
function foldLeftLoop<A, B>(
  self: Cause<A>,
  b: B,
  f: (b: B, a: Cause<A>) => Maybe<B>,
  stack: List<Cause<A>>,
): B {
  const z = f(b, self).getOrElse(b);

  switch (self._tag) {
    case CauseTag.Both:
    case CauseTag.Then: {
      return foldLeftLoop(self.left, z, f, stack.prepend(self.right));
    }
    default: {
      if (stack.isNonEmpty()) {
        return foldLeftLoop(stack.unsafeHead, z, f, stack.unsafeTail);
      }
      return z;
    }
  }
}

/**
 * Constructs a `Cause` from a single `unknown`, representing an untyped failure
 *
 * @tsplus static fncts.data.CauseOps halt
 * @tsplus static fncts.data.Cause.HaltOps __call
 */
export function halt(value: unknown, trace: Trace = Trace.none): Cause<never> {
  return new Halt(value, trace);
}

/**
 * Determines whether a `Cause` contains a defect
 *
 * @tsplus getter fncts.data.Cause halted
 */
export function halted<E>(self: Cause<E>): self is Halt {
  return self.haltMaybe.match(
    () => false,
    () => true,
  );
}

/**
 * Returns the `unknown` associated with the first `Halt` in this `Cause` if one exists.
 *
 * @tsplus getter fncts.data.Cause haltMaybe
 */
export function haltMaybe<E>(self: Cause<E>): Maybe<unknown> {
  return self.find((c) => (c._tag === CauseTag.Halt ? Maybe.just(c.value) : Maybe.nothing()));
}

/**
 * Constructs a `Cause` from an `Id`, representing an interruption of asynchronous computation
 *
 * @tsplus static fncts.data.CauseOps interrupt
 * @tsplus static fncts.data.Cause.InterruptOps __call
 */
export function interrupt(id: FiberId, trace: Trace = Trace.none): Cause<never> {
  return new Interrupt(id, trace);
}

/**
 * A type-guard matching `Both`
 *
 * @tsplus fluent fncts.data.Cause isBoth
 */
export function isBoth<E>(self: Cause<E>): self is Both<E> {
  return self._tag === CauseTag.Both;
}

/**
 * A type-guard matching `Fail`
 *
 * @tsplus fluent fncts.data.Cause isFail
 */
export function isFail<E>(self: Cause<E>): self is Fail<E> {
  return self._tag === CauseTag.Fail;
}

/**
 * @tsplus fluent fncts.data.Cause isHalt
 */
export function isHalt<E>(self: Cause<E>): self is Halt {
  return self._tag === CauseTag.Halt;
}

/**
 * A type-guard matching `Then`
 *
 * @tsplus fluent fncts.data.Cause isThen
 */
export function isThen<E>(self: Cause<E>): self is Then<E> {
  return self._tag === CauseTag.Then;
}

/**
 * A type-guard matching `Traced`
 *
 * @tsplus getter fncts.data.Cause isTraced
 */
export function isTraced<E>(self: Cause<E>): boolean {
  return self
    .find((cause) => {
      switch (cause._tag) {
        case "Halt":
        case "Fail":
        case "Interrupt":
          return cause.trace !== Trace.none ? Just(undefined) : Nothing();
        default:
          return Nothing();
      }
    })
    .isJust();
}

/**
 * Determines whether the `Cause` contains an interruption
 *
 * @tsplus getter fncts.data.Cause interrupted
 */
export function interrupted<E>(self: Cause<E>): boolean {
  return self.interruptOption.match(
    () => false,
    () => true,
  );
}

/**
 * Returns the `FiberId` associated with the first `Interrupt` in this `Cause` if one exists.
 *
 * @tsplus getter fncts.data.Cause interruptOption
 */
export function interruptOption<E>(self: Cause<E>): Maybe<FiberId> {
  return self.find((c) => (c._tag === CauseTag.Interrupt ? Just(c.id) : Nothing()));
}

/**
 * Returns a set of interruptors, fibers that interrupted the fiber described
 * by this `Cause`.
 *
 * @tsplus getter fncts.data.Cause interruptors
 */
export function interruptors<E>(self: Cause<E>): ReadonlySet<FiberId> {
  return self.foldLeft(new Set(), (s, c) =>
    c._tag === CauseTag.Interrupt ? Just(s.add(c.id)) : Nothing(),
  );
}

/**
 * Determines if the `Cause` contains only interruptions and not any `Halt` or
 * `Fail` causes.
 *
 * @tsplus getter fncts.data.Cause interruptedOnly
 */
export function interruptedOnly<E>(self: Cause<E>): boolean {
  return self
    .find((c) => (halted(c) || failed(c) ? Maybe.just(false) : Maybe.nothing()))
    .getOrElse(true);
}

/**
 * Remove all `Fail` and `Interrupt` nodes from this `Cause`,
 * return only `Halt` cause/finalizer defects.
 *
 * @tsplus getter fncts.data.Cause keepDefects
 */
export function keepDefects<E>(self: Cause<E>): Maybe<Cause<never>> {
  return self.fold({
    Empty: () => Nothing(),
    Fail: () => Nothing(),
    Halt: (t, trace) => Just(Halt(t, trace)),
    Interrupt: () => Nothing(),
    Then: (l, r) => {
      if (l.isJust() && r.isJust()) {
        return Just(Then(l.value, r.value));
      } else if (l.isJust() && r.isNothing()) {
        return Just(l.value);
      } else if (l.isNothing() && r.isJust()) {
        return Just(r.value);
      } else {
        return Nothing();
      }
    },
    Both: (l, r) => {
      if (l.isJust() && r.isJust()) {
        return Just(Both(l.value, r.value));
      } else if (l.isJust() && r.isNothing()) {
        return Just(l.value);
      } else if (l.isNothing() && r.isJust()) {
        return Just(r.value);
      } else {
        return Nothing();
      }
    },
    Stackless: (maybeCause, stackless) => maybeCause.map((cause) => Stackless(cause, stackless)),
  });
}

/**
 * @tsplus fluent fncts.data.Cause map
 */
export function map_<A, B>(self: Cause<A>, f: (e: A) => B): Cause<B> {
  return self.chain((e) => Cause.fail(f(e), Trace.none));
}

/**
 * @tsplus fluent fncts.data.Cause mapTrace
 */
export function mapTrace_<E>(self: Cause<E>, f: (trace: Trace) => Trace): Cause<E> {
  return self.fold({
    Empty: () => Cause.empty(),
    Fail: (e, trace) => Cause.fail(e, f(trace)),
    Halt: (u, trace) => Cause.halt(u, f(trace)),
    Interrupt: (id, trace) => Cause.interrupt(id, f(trace)),
    Then: Cause.then,
    Both: Cause.both,
    Stackless: Cause.stackless,
  });
}

/**
 * @tsplus static fncts.data.CauseOps stackless
 * @tsplus static fncts.data.Cause.StacklessOps __call
 */
export function stackless<E>(cause: Cause<E>, stackless: boolean): Cause<E> {
  return new Stackless(cause, stackless);
}

/**
 * Discards all typed failures kept on this `Cause`.
 *
 * @tsplus getter fncts.data.Cause stripFailures
 */
export function stripFailures<A>(self: Cause<A>): Cause<never> {
  return self.fold({
    Empty: () => Empty(),
    Fail: () => Empty(),
    Halt: (u, trace) => Halt(u, trace),
    Interrupt: (fiberId, trace) => Interrupt(fiberId, trace),
    Then: (l, r) => Then(l, r),
    Both: (l, r) => Both(l, r),
    Stackless: (c, stackless) => Stackless(c, stackless),
  });
}

function sequenceCauseEitherEval<E, A>(self: Cause<Either<E, A>>): Eval<Either<Cause<E>, A>> {
  switch (self._tag) {
    case CauseTag.Empty: {
      return Eval.now(Either.left(Cause.empty()));
    }
    case CauseTag.Interrupt: {
      return Eval.now(Either.left(self));
    }
    case CauseTag.Fail: {
      return Eval.now(
        self.value.match(
          (e) => Either.left(Cause.fail(e, Trace.none)),
          (a) => Either.right(a),
        ),
      );
    }
    case CauseTag.Halt: {
      return Eval.now(Either.left(self));
    }
    case CauseTag.Then: {
      return Eval.defer(() => sequenceCauseEitherEval(self.left)).zipWith(
        Eval.defer(() => sequenceCauseEitherEval(self.right)),
        (lefts, rights) => {
          return lefts._tag === "Left"
            ? rights._tag === "Right"
              ? Either.right(rights.right)
              : Either.left(Cause.then(lefts.left, rights.left))
            : Either.right(lefts.right);
        },
      );
    }
    case CauseTag.Both: {
      return Eval.defer(() => sequenceCauseEitherEval(self.left)).zipWith(
        Eval.defer(() => sequenceCauseEitherEval(self.right)),
        (lefts, rights) => {
          return lefts._tag === "Left"
            ? rights._tag === "Right"
              ? Either.right(rights.right)
              : Either.left(Cause.both(lefts.left, rights.left))
            : Either.right(lefts.right);
        },
      );
    }
    case CauseTag.Stackless: {
      return Eval.defer(sequenceCauseEitherEval(self.cause)).map((_) =>
        _.mapLeft((cause) => Stackless(cause, self.stackless)),
      );
    }
  }
}

/**
 * Converts the specified `Cause<Either<E, A>>` to an `Either<Cause<E>, A>`.
 *
 * @tsplus getter fncts.data.Cause sequenceCauseEither
 */
export function sequenceCauseEither<E, A>(self: Cause<Either<E, A>>): Either<Cause<E>, A> {
  return Eval.run(sequenceCauseEitherEval(self));
}

function sequenceCauseMaybeEval<E>(self: Cause<Maybe<E>>): Eval<Maybe<Cause<E>>> {
  switch (self._tag) {
    case CauseTag.Empty: {
      return Eval.now(Maybe.just(Cause.empty()));
    }
    case CauseTag.Interrupt: {
      return Eval.now(Maybe.just(self));
    }
    case CauseTag.Fail: {
      return Eval.now(self.value.map((e) => Cause.fail(e, Trace.none)));
    }
    case CauseTag.Halt: {
      return Eval.now(Maybe.just(self));
    }
    case CauseTag.Then: {
      return Eval.defer(() => sequenceCauseMaybeEval(self.left)).zipWith(
        Eval.defer(() => sequenceCauseMaybeEval(self.right)),
        (lefts, rights) => {
          return lefts._tag === "Just"
            ? rights._tag === "Just"
              ? Maybe.just(Cause.then(lefts.value, rights.value))
              : lefts
            : rights._tag === "Just"
            ? rights
            : Maybe.nothing();
        },
      );
    }
    case CauseTag.Both: {
      return Eval.defer(() => sequenceCauseMaybeEval(self.left)).zipWith(
        Eval.defer(() => sequenceCauseMaybeEval(self.right)),
        (lefts, rights) => {
          return lefts._tag === "Just"
            ? rights._tag === "Just"
              ? Maybe.just(Cause.both(lefts.value, rights.value))
              : lefts
            : rights._tag === "Just"
            ? rights
            : Maybe.nothing();
        },
      );
    }
    case CauseTag.Stackless: {
      return Eval.defer(sequenceCauseMaybeEval(self.cause)).map((_) =>
        _.map((cause) => Stackless(cause, self.stackless)),
      );
    }
  }
}

/**
 * Converts the specified `Cause<Maybe<E>>` to an `Option<Cause<E>>`.
 *
 * @tsplus getter fncts.data.Cause sequenceCauseMaybe
 */
export function sequenceCauseMaybe<E>(self: Cause<Maybe<E>>): Maybe<Cause<E>> {
  return Eval.run(sequenceCauseMaybeEval(self));
}

// /**
//  * Squashes a `Cause` down to a single `Error`, chosen to be the
//  * "most important" `Error`.
//  */
// export function squash_<Id>(
//   S: P.Show<Id>
// ): <E>(cause: Cause<E>, f: (e: E) => unknown) => unknown {
//   return (cause, f) =>
//     cause.failureOption
//       .map(f)
//       .orElse(
//         interrupted(cause)
//           ? Maybe.just<unknown>(
//               new InterruptedException(
//                 "Interrupted by fibers: " +
//                   Array.from(interruptors(cause))
//                     .map((id) => S.show(id))
//                     .join(", ")
//               )
//             )
//           : Maybe.nothing()
//       )
//       .orElse(defects(cause).head)
//       .getOrElse(new InterruptedException("Interrupted"));
// }

// /**
//  * @tsplus getter PCause squash
//  */
// export function squash0<Id, E>(self: Cause<E>) {
//   return (S: P.Show<Id>) =>
//     (f: (e: E) => unknown): unknown =>
//       squash_(S)(self, f);
// }

// /**
//  * Squashes a `Cause` down to a single `Error`, chosen to be the
//  * "most important" `Error`.
//  *
//  * @dataFirst squash_
//  */
// export function squash<Id>(
//   S: P.Show<Id>
// ): <E>(f: (e: E) => unknown) => (cause: Cause<E>) => unknown {
//   return (f) => (cause) => squash_(S)(cause, f);
// }

/**
 * Constructs a `Cause` from two `Cause`s, representing sequential failures.
 *
 * @note If one of the `Cause`s is `Empty`, the non-empty `Cause` is returned
 *
 * @tsplus static fncts.data.CauseOps then
 * @tsplus static fncts.data.Cause.ThenOps __call
 */
export function then<E, E1>(left: Cause<E>, right: Cause<E1>): Cause<E | E1> {
  return left.isEmpty ? right : right.isEmpty ? left : new Then<E | E1>(left, right);
}

/**
 * Constructs a `Cause` from a `Cause` and a stack trace.
 *
 * @note If the stack trace is empty, the original `Cause` is returned.
 *
 * @tsplus static fncts.data.CauseOps traced
 * @tsplus static fncts.data.Cause.TracedOps __call
 */
export function traced<E>(cause: Cause<E>, trace: Trace): Cause<E> {
  return cause.mapTrace((t) => t.combine(trace));
}

/**
 * Returns a `Cause` that has been stripped of all tracing information.
 *
 * @tsplus getter fncts.data.Cause untraced
 */
export function untraced<E>(self: Cause<E>): Cause<E> {
  return self.mapTrace(() => Trace.none);
}

// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/fold.js";
export * from "./api/isEmpty.js";
export * from "./api/linearize.js";
export * from "./api/prettyPrint.js";
export * from "./api/unified.js";
// codegen:end
