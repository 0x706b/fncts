import type { Lazy } from "../../data/function.js";
import type { Predicate } from "../../data/Predicate.js";
import type { Refinement } from "../../data/Refinement.js";

import { Either } from "../../data/Either.js";
import { identity } from "../../data/function.js";
import { Just, Maybe, Nothing } from "../../data/Maybe.js";
import { TxnId } from "../../data/TxnId.js";
import { AtomicReference } from "../../internal/AtomicReference.js";
import { IO } from "../IO.js";
import { ContramapEnvironment, Effect, HaltException, STM } from "./definition.js";
import { CommitState } from "./internal/CommitState.js";
import { tryCommitAsync, tryCommitSync } from "./internal/Journal.js";
import { TryCommitTag } from "./internal/TryCommit.js";

/**
 * Maps the success value of this effect to the specified constant value.
 *
 * @tsplus fluent fncts.control.STM as
 */
export function as_<R, E, A, B>(stm: STM<R, E, A>, b: Lazy<B>): STM<R, E, B> {
  return stm.map(() => b());
}

/**
 * Maps the success value of this effect to an optional value.
 *
 * @tsplus getter fncts.control.STM asJust
 */
export function asJust<R, E, A>(stm: STM<R, E, A>): STM<R, E, Maybe<A>> {
  return stm.map(Maybe.just);
}

/**
 * Maps the error value of this effect to an optional value.
 *
 * @tsplus getter fncts.control.STM asJustError
 */
export function asJustError<R, E, A>(stm: STM<R, E, A>): STM<R, Maybe<E>, A> {
  return stm.mapError(Maybe.just);
}

/**
 * Submerges the error case of an `Either` into the `STM`. The inverse
 * operation of `STM.either`.
 *
 * @tsplus getter fncts.control.STM absolve
 */
export function absolve<R, E, E1, A>(z: STM<R, E, Either<E1, A>>): STM<R, E | E1, A> {
  return z.chain(STM.fromEitherNow);
}

/**
 * Retrieves the environment inside an stm.
 *
 * @tsplus static fncts.control.STMOps environment
 */
export function environment<R>(): STM<R, never, R> {
  return new Effect((_, __, r: R) => r);
}

/**
 * Accesses the environment of the transaction.
 *
 * @tsplus static fncts.control.STMOps environmentWith
 */
export function environmentWith<R, A>(f: (r: R) => A): STM<R, never, A> {
  return STM.environment<R>().map(f);
}

/**
 * Accesses the environment of the transaction to perform a transaction.
 *
 * @tsplus static fncts.control.STMOps environmentWithSTM
 */
export function environmentWithSTM<R0, R, E, A>(f: (r: R0) => STM<R, E, A>) {
  return STM.environment<R0>().chain(f);
}

/**
 * @tsplus static fncts.control.STMOps atomically
 * @tsplus getter fncts.control.STM commit
 */
export function atomically<R, E, A>(stm: STM<R, E, A>): IO<R, E, A> {
  return IO.environmentWithIO((r: R) =>
    IO.deferWith((_, fiberId) => {
      const result = tryCommitSync(fiberId, stm, r);
      switch (result._tag) {
        case TryCommitTag.Done: {
          return IO.fromExitNow(result.exit);
        }
        case TryCommitTag.Suspend: {
          const id    = TxnId.make();
          const state = new AtomicReference<CommitState<E, A>>(CommitState.Running);
          const async = IO.async(tryCommitAsync(result.journal, fiberId, stm, id, state, r));
          return IO.uninterruptibleMask(({ restore }) =>
            restore(async).catchAllCause((cause) => {
              state.compareAndSet(CommitState.Running, CommitState.Interrupted);
              const newState = state.get;
              switch (newState._tag) {
                case "Done": {
                  return IO.fromExitNow(newState.exit);
                }
                default: {
                  return IO.failCauseNow(cause);
                }
              }
            }),
          );
        }
      }
    }),
  );
}

/**
 * Returns an `STM` effect whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 */
export function bimap_<R, E, A, E1, B>(
  stm: STM<R, E, A>,
  g: (e: E) => E1,
  f: (a: A) => B,
): STM<R, E1, B> {
  return stm.matchSTM(
    (e) => STM.failNow(g(e)),
    (a) => STM.succeedNow(f(a)),
  );
}

/**
 * Recovers from specified error.
 *
 * @tsplus fluent fncts.control.STM catch
 */
export function catch_<N extends keyof E, K extends E[N] & string, E, R, A, R1, E1, A1>(
  stm: STM<R, E, A>,
  tag: N,
  k: K,
  f: (e: Extract<E, { [n in N]: K }>) => STM<R1, E1, A1>,
): STM<R & R1, Exclude<E, { [n in N]: K }> | E1, A | A1> {
  return stm.catchAll((e) => {
    if (tag in e && e[tag] === k) {
      return f(e as any);
    }
    return STM.failNow(e as any);
  });
}

/**
 * Recovers from some or all of the error cases.
 *
 * @tsplus fluent fncts.control.STM catchJust
 */
export function catchJust_<R, E, A, R1, E1, B>(
  stm: STM<R, E, A>,
  f: (e: E) => Maybe<STM<R1, E1, B>>,
): STM<R1 & R, E | E1, A | B> {
  return stm.catchAll((e): STM<R1, E | E1, A | B> => f(e).getOrElse(STM.failNow(e)));
}

/**
 * Recovers from specified error.
 *
 * @tsplus fluent fncts.control.STM catchTag
 */
export function catchTag_<
  K extends E["_tag"] & string,
  E extends { _tag: string },
  R,
  A,
  R1,
  E1,
  A1,
>(
  stm: STM<R, E, A>,
  k: K,
  f: (e: Extract<E, { _tag: K }>) => STM<R1, E1, A1>,
): STM<R & R1, Exclude<E, { _tag: K }> | E1, A | A1> {
  return stm.catchAll((e) => {
    if ("_tag" in e && e["_tag"] === k) {
      return f(e as any);
    }
    return STM.failNow(e as any);
  });
}

/**
 * Creates a composite effect that represents this effect followed by another
 * one that may depend on the error produced by this one.
 *
 * @tsplus fluent fncts.control.STM chainError
 */
export function chainError_<R, E, A, R2, E2>(
  stm: STM<R, E, A>,
  f: (e: E) => STM<R2, never, E2>,
): STM<R2 & R, E2, A> {
  return stm.swapWith((effect) => effect.chain(f));
}

/**
 * Checks the condition, and if it's true, returns unit, otherwise, retries.
 *
 * @tsplus static fncts.control.STMOps check
 */
export function check(predicate: () => boolean): STM<unknown, never, void> {
  return STM.defer(() => (predicate() ? STM.unit : STM.retry));
}

/**
 * Commits this transaction atomically, regardless of whether the transaction
 * is a success or a failure.
 */
export function commitEither<R, E, A>(stm: STM<R, E, A>): IO<R, E, A> {
  return stm.either.commit.absolve;
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * succeed with the returned value.
 *
 * @tsplus fluent fncts.control.STM continueOrFail
 */
export function continueOrFail_<R, E, E1, A, A2>(
  fa: STM<R, E, A>,
  e: Lazy<E1>,
  pf: (a: A) => Maybe<A2>,
): STM<R, E | E1, A2> {
  return fa.continueOrFailSTM(e, (a) => pf(a).map(STM.succeedNow));
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * continue with the returned value.
 *
 * @tsplus fluent fncts.control.STM continueOrFailSTM
 */
export function continueOrFailSTM_<R, E, E1, A, R2, E2, A2>(
  fa: STM<R, E, A>,
  e: Lazy<E1>,
  pf: (a: A) => Maybe<STM<R2, E2, A2>>,
): STM<R2 & R, E | E1 | E2, A2> {
  return fa.chain((a) => pf(a).getOrElse(STM.fail(e)));
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * succeed with the returned value.
 *
 * @tsplus fluent fncts.control.STM continueOrRetry
 */
export function continueOrRetry_<R, E, A, A2>(
  fa: STM<R, E, A>,
  pf: (a: A) => Maybe<A2>,
): STM<R, E, A2> {
  return fa.continueOrRetrySTM((a) => pf(a).map(STM.succeedNow));
}

/**
 * Simultaneously filters and flatMaps the value produced by this effect.
 * Continues on the effect returned from pf.
 *
 * @tsplus fluent fncts.control.STM continueOrRetrySTM
 */
export function continueOrRetrySTM_<R, E, A, R2, E2, A2>(
  fa: STM<R, E, A>,
  pf: (a: A) => Maybe<STM<R2, E2, A2>>,
): STM<R2 & R, E | E2, A2> {
  return fa.chain((a) => pf(a).getOrElse(STM.retry));
}

/**
 * Suspends creation of the specified transaction lazily.
 *
 * @tsplus static fncts.control.STMOps defer
 */
export function defer<R, E, A>(make: Lazy<STM<R, E, A>>): STM<R, E, A> {
  return STM.succeed(make).flatten;
}

/**
 * Converts the failure channel into an `Either`.
 *
 * @tsplus getter fncts.control.STM either
 */
export function either<R, E, A>(stm: STM<R, E, A>): STM<R, never, Either<E, A>> {
  return stm.match(Either.left, Either.right);
}

/**
 * Returns an effect that ignores errors and runs repeatedly until it eventually succeeds.
 *
 * @tsplus getter fncts.control.STM eventually
 */
export function eventually<R, E, A>(stm: STM<R, E, A>): STM<R, never, A> {
  return stm.matchSTM(() => stm.eventually, STM.succeedNow);
}

/**
 * Simultaneously filters and maps the value produced by this effect.
 *
 * @tsplus fluent fncts.control.STM filterMap
 */
export function filterMap_<R, E, A, B>(stm: STM<R, E, A>, f: (a: A) => Maybe<B>): STM<R, E, B> {
  return stm.filterMapSTM((a) => f(a).map(STM.succeedNow));
}

/**
 * Simultaneously filters and chains the value produced by this effect.
 * Continues on the effect returned from f.
 *
 * @tsplus fluent fncts.control.STM filterMapSTM
 */
export function filterMapSTM_<R, E, A, R1, E1, B>(
  self: STM<R, E, A>,
  f: (a: A) => Maybe<STM<R1, E1, B>>,
): STM<R & R1, E | E1, B> {
  return self.matchSTM(STM.failNow, (a) => f(a).getOrElse(STM.retry));
}

/**
 * Applies `or` if the predicate fails.
 *
 * @tsplus fluent fncts.control.STM filterOrElse
 */
export function filterOrElse_<R, E, A, B extends A, R2, E2, A2>(
  fa: STM<R, E, A>,
  p: Refinement<A, B>,
  or: (a: Exclude<A, B>) => STM<R2, E2, A2>,
): STM<R & R2, E | E2, B | A2>;
export function filterOrElse_<R, E, A, R2, E2, A2>(
  fa: STM<R, E, A>,
  p: Predicate<A>,
  or: (a: A) => STM<R2, E2, A2>,
): STM<R & R2, E | E2, A | A2>;
export function filterOrElse_<R, E, A, R2, E2, A2>(
  fa: STM<R, E, A>,
  p: Predicate<A>,
  or: unknown,
): STM<R & R2, E | E2, A | A2> {
  return fa.chain((a) =>
    p(a) ? STM.succeedNow(a) : STM.defer((or as (a: A) => STM<R2, E2, A2>)(a)),
  );
}

/**
 * Fails with `failWith` if the predicate fails.
 *
 * @tsplus fluent fncts.control.STM filterOrFail
 */
export function filterOrFail_<R, E, E1, A, B extends A>(
  fa: STM<R, E, A>,
  p: Refinement<A, B>,
  failWith: (a: Exclude<A, B>) => E1,
): STM<R, E | E1, B>;
export function filterOrFail_<R, E, E1, A>(
  fa: STM<R, E, A>,
  p: Predicate<A>,
  failWith: (a: A) => E1,
): STM<R, E | E1, A>;
export function filterOrFail_<R, E, E1, A>(
  fa: STM<R, E, A>,
  p: Predicate<A>,
  failWith: unknown,
): STM<R, E | E1, A> {
  return fa.filterOrElse(p, (a) => STM.fail((failWith as (a: A) => E1)(a)));
}

/**
 * Halts with specified `unknown` if the predicate fails.
 *
 * @tsplus fluent fncts.control.STM filterOrHalt
 */
export function filterOrHalt_<R, E, A, B extends A>(
  fa: STM<R, E, A>,
  p: Refinement<A, B>,
  haltWith: (a: Exclude<A, B>) => unknown,
): STM<R, E, B>;
export function filterOrHalt_<R, E, A>(
  fa: STM<R, E, A>,
  p: Predicate<A>,
  haltWith: (a: A) => unknown,
): STM<R, E, A>;
export function filterOrHalt_<R, E, A>(
  fa: STM<R, E, A>,
  p: Predicate<A>,
  haltWith: unknown,
): STM<R, E, A> {
  return fa.filterOrElse(p, (a) => STM.halt((haltWith as (a: A) => unknown)(a)));
}

/**
 * Flattens out a nested `STM` effect.
 *
 * @tsplus getter fncts.control.STM flatten
 */
export function flatten<R, E, R1, E1, B>(stm: STM<R, E, STM<R1, E1, B>>): STM<R1 & R, E | E1, B> {
  return stm.chain(identity);
}

/**
 * Unwraps the optional error, defaulting to the provided value.
 *
 * @tsplus fluent fncts.control.STM flattenErrorOption
 */
export function flattenErrorOption_<R, E, A, E2>(
  stm: STM<R, Maybe<E>, A>,
  def: Lazy<E2>,
): STM<R, E | E2, A> {
  return stm.mapError((me) => me.getOrElse(def));
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns a transactional effect that produces a new `ReadonlyArray<B>`.
 *
 * @tsplus static fncts.control.STMOps foreach
 */
export function foreach_<A, R, E, B>(
  it: Iterable<A>,
  f: (a: A) => STM<R, E, B>,
): STM<R, E, readonly B[]> {
  return STM.defer(() => {
    let stm = STM.succeedNow([]) as STM<R, E, B[]>;

    for (const a of it) {
      stm = stm.zipWith(f(a), (acc, b) => {
        acc.push(b);
        return acc;
      });
    }

    return stm;
  });
}

/**
 * Lifts an `Either` into a `STM`.
 *
 * @tsplus static fncts.control.STMOps fromEither
 */
export function fromEither<E, A>(e: Lazy<Either<E, A>>): STM<unknown, E, A> {
  return STM.defer(e().match(STM.failNow, STM.succeedNow));
}

/**
 * Lifts an `Either` into a `STM`.
 *
 * @tsplus static fncts.control.STMOps fromEitherNow
 */
export function fromEitherNow<E, A>(e: Either<E, A>): STM<unknown, E, A> {
  return e.match(STM.failNow, STM.succeedNow);
}

/**
 * Unwraps the optional success of this effect, but can fail with an None value.
 */
export function get<R, E, A>(stm: STM<R, E, Maybe<A>>): STM<R, Maybe<E>, A> {
  return stm.matchSTM(
    (e) => STM.failNow(Just(e)),
    (ma) => ma.match(() => STM.failNow(Nothing()), STM.succeedNow),
  );
}

/**
 * Provides the transaction its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus fluent fncts.control.STM provideEnvironment
 */
export function provideEnvironment_<R, E, A>(stm: STM<R, E, A>, r: R): STM<unknown, E, A> {
  return stm.contramapEnvironment(() => r);
}

/**
 * Provides some of the environment required to run this effect,
 * leaving the remainder `R0`.
 *
 * @tsplus fluent fncts.control.STM contramapEnvironment
 */
export function contramapEnvironment_<R, E, A, R0>(
  self: STM<R, E, A>,
  f: (r: R0) => R,
): STM<R0, E, A> {
  return new ContramapEnvironment(self, f);
}

/**
 * Halts the fiber running the effect.
 *
 * @tsplus static fncts.control.STMOps halt
 */
export function halt(u: Lazy<unknown>): STM<unknown, never, never> {
  return new Effect(() => {
    throw new HaltException(u());
  });
}

/**
 * Halts the fiber running the effect.
 *
 * @tsplus static fncts.control.STMOps haltNow
 */
export function haltNow(u: unknown): STM<unknown, never, never> {
  return new Effect(() => {
    throw new HaltException(u);
  });
}

/**
 * Returns a successful effect with the head of the list if the list is
 * non-empty or fails with the error `None` if the list is empty.
 *
 * @tsplus getter fncts.control.STM head
 */
export function head<R, E, A>(stm: STM<R, E, Iterable<A>>): STM<R, Maybe<E>, A> {
  return stm.matchSTM(
    (e) => STM.failNow(Just(e)),
    (ia) => {
      const it   = ia[Symbol.iterator]();
      const next = it.next();
      return next.done ? STM.failNow(Nothing()) : STM.succeedNow(next.value);
    },
  );
}

/**
 * Interrupts the fiber running the effect.
 *
 * @tsplus static fncts.control.STMOps interrupt
 */
export const interrupt: STM<unknown, never, never> = STM.fiberId.chain((id) => STM.interruptAs(id));

/**
 * Returns whether this effect is a failure.
 *
 * @tsplus getter fncts.control.STM isFailure
 */
export function isFailure<R, E, A>(stm: STM<R, E, A>) {
  return stm.match(
    () => true,
    () => false,
  );
}

/**
 * Returns whether this effect is a success.
 *
 * @tsplus getter fncts.control.STM isSuccess
 */
export function isSuccess<R, E, A>(stm: STM<R, E, A>) {
  return stm.match(
    () => false,
    () => true,
  );
}

/**
 * Depending on provided environment returns either this one or the other effect.
 *
 * @tsplus fluent fncts.control.STM join
 */
export function join_<R, E, A, R1, E1, A1>(
  stm: STM<R, E, A>,
  that: STM<R1, E1, A1>,
): STM<Either<R, R1>, E | E1, A | A1> {
  return STM.environmentWithSTM(
    (r: Either<R, R1>): STM<unknown, E | E1, A | A1> =>
      r.match(
        (r) => stm.provideEnvironment(r),
        (r1) => that.provideEnvironment(r1),
      ),
  );
}

/**
 * Depending on provided environment returns either this one or the other effect.
 *
 * @tsplus fluent fncts.control.STM joinEither
 */
export function joinEither_<R, E, A, R1, E1, A1>(
  stm: STM<R, E, A>,
  that: STM<R1, E1, A1>,
): STM<Either<R, R1>, E | E1, Either<A, A1>> {
  return STM.environmentWithSTM(
    (r: Either<R, R1>): STM<unknown, E | E1, Either<A, A1>> =>
      r.match(
        (r) => stm.provideEnvironment(r).map(Either.left),
        (r1) => that.provideEnvironment(r1).map(Either.right),
      ),
  );
}

/**
 * Returns a successful effect if the value is `Left`, or fails with the error `None`.
 *
 * @tsplus getter fncts.control.STM left
 */
export function left<R, E, B, C>(stm: STM<R, E, Either<B, C>>): STM<R, Maybe<E>, B> {
  return stm.matchSTM(
    (e) => STM.fail(Just(e)),
    (bc) => bc.match(STM.succeedNow, () => STM.failNow(Nothing())),
  );
}

/**
 * Returns a successful effect if the value is `Left`, or fails with the error e.
 *
 * @tsplus fluent fncts.control.STM leftOrFail
 */
export function leftOrFail_<R, E, B, C, E1>(
  stm: STM<R, E, Either<B, C>>,
  orFail: (c: C) => E1,
): STM<R, E | E1, B> {
  return stm.chain((bc) => bc.match(STM.succeedNow, (c) => STM.fail(orFail(c))));
}

/**
 * Maps from one error type to another.
 *
 * @tsplus fluent fncts.control.STM mapError
 */
export function mapError_<R, E, A, E1>(stm: STM<R, E, A>, f: (a: E) => E1): STM<R, E1, A> {
  return stm.matchSTM((e) => STM.failNow(f(e)), STM.succeedNow);
}

/**
 * Folds over the `STM` effect, handling both failure and success, but not
 * retry.
 *
 * @tsplus fluent fncts.control.STM match
 */
export function match_<R, E, A, B, C>(
  stm: STM<R, E, A>,
  g: (e: E) => C,
  f: (a: A) => B,
): STM<R, never, B | C> {
  return stm.matchSTM(
    (e) => STM.succeedNow(g(e)),
    (a) => STM.succeedNow(f(a)),
  );
}

/**
 * Repeats this `STM` effect until its result satisfies the specified predicate.
 *
 * WARNING:
 * `repeatUntil` uses a busy loop to repeat the effect and will consume a thread until
 * it completes (it cannot yield). This is because STM describes a single atomic
 * transaction which must either complete, retry or fail a transaction before
 * yielding back to the Effect Runtime.
 *
 * - Use `retryUntil` instead if you don't need to maintain transaction state for repeats.
 * - Ensure repeating the STM effect will eventually satisfy the predicate.
 *
 * @tsplus fluent fncts.control.STM repeatUntil
 */
export function repeatUntil_<R, E, A>(stm: STM<R, E, A>, f: (a: A) => boolean): STM<R, E, A> {
  return stm.chain((a) => (f(a) ? STM.succeedNow(a) : stm.repeatUntil(f)));
}

/**
 * Repeats this `STM` effect while its result satisfies the specified predicate.
 *
 * WARNING:
 * `repeatWhile` uses a busy loop to repeat the effect and will consume a thread until
 * it completes (it cannot yield). This is because STM describes a single atomic
 * transaction which must either complete, retry or fail a transaction before
 * yielding back to the Effect Runtime.
 *
 * - Use `retryWhile` instead if you don't need to maintain transaction state for repeats.
 * - Ensure repeating the STM effect will eventually not satisfy the predicate.
 *
 * @tsplus fluent fncts.control.STM repeatWhile
 */
export function repeatWhile_<R, E, A>(stm: STM<R, E, A>, f: (a: A) => boolean): STM<R, E, A> {
  return stm.chain((a) => (f(a) ? stm.repeatWhile(f) : STM.succeedNow(a)));
}

/**
 * Returns an effect that swaps the error/success cases. This allows you to
 * use all methods on the error channel, possibly before flipping back.
 *
 * @tsplus getter fncts.control.STM swap
 */
export function swap<R, E, A>(stm: STM<R, E, A>): STM<R, A, E> {
  return stm.matchSTM(STM.succeedNow, STM.failNow);
}

/**
 * Swaps the error/value parameters, applies the function `f` and flips the parameters back
 *
 * @tsplus fluent fncts.control.STM swapWith
 */
export function swapWith_<R, E, A, R2, E2, A2>(
  stm: STM<R, E, A>,
  f: (stm: STM<R, A, E>) => STM<R2, A2, E2>,
): STM<R2, E2, A2> {
  return f(stm.swap).swap;
}

/**
 * "Peeks" at the success of transactional effect.
 *
 * @tsplus fluent fncts.control.STM tap
 */
export function tap_<R, E, A, R1, E1, B>(
  stm: STM<R, E, A>,
  f: (a: A) => STM<R1, E1, B>,
): STM<R1 & R, E | E1, A> {
  return stm.chain((a) => f(a).as(a));
}

/**
 * Returns an effect with the value on the left part.
 *
 * @tsplus static fncts.control.STMOps toLeft
 */
export function toLeft<A>(a: Lazy<A>): STM<unknown, never, Either<A, never>> {
  return STM.succeed(a).chain((a) => STM.succeedNow(Either.left(a)));
}

/**
 * Returns an `STM` effect that succeeds with `Unit`.
 *
 * @tsplus static fncts.control.STMOps unit
 */
export const unit = STM.succeedNow<void>(undefined);

/**
 * Sequentially zips this value with the specified one, combining the values
 * using the specified combiner function.
 *
 * @tsplus fluent fncts.control.STM zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: STM<R, E, A>,
  that: STM<R1, E1, B>,
  f: (a: A, b: B) => C,
): STM<R & R1, E | E1, C> {
  return self.chain((a) => that.map((b) => f(a, b)));
}
