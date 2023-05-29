import type { Journal } from "./internal/Journal.js";

import { identity } from "@fncts/base/data/function";

import { ContramapEnvironment, Effect, HaltException, STM } from "./definition.js";

/**
 * Maps the success value of this effect to the specified constant value.
 *
 * @tsplus pipeable fncts.io.STM as
 */
export function as<B>(b: Lazy<B>, __tsplusTrace?: string) {
  return <R, E, A>(stm: STM<R, E, A>): STM<R, E, B> => {
    return stm.map(() => b());
  };
}

/**
 * Maps the success value of this effect to an optional value.
 *
 * @tsplus getter fncts.io.STM asJust
 */
export function asJust<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): STM<R, E, Maybe<A>> {
  return stm.map(Maybe.just);
}

/**
 * Maps the error value of this effect to an optional value.
 *
 * @tsplus getter fncts.io.STM asJustError
 */
export function asJustError<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): STM<R, Maybe<E>, A> {
  return stm.mapError(Maybe.just);
}

/**
 * Submerges the error case of an `Either` into the `STM`. The inverse
 * operation of `STM.either`.
 *
 * @tsplus getter fncts.io.STM absolve
 */
export function absolve<R, E, E1, A>(z: STM<R, E, Either<E1, A>>, __tsplusTrace?: string): STM<R, E | E1, A> {
  return z.flatMap(STM.fromEitherNow);
}

/**
 * @tsplus static fncts.io.STMOps Effect
 */
export function makeEffect<R, E, A>(
  f: (journal: Journal, fiberId: FiberId, r: Environment<R>) => A,
  __tsplusTrace?: string,
): STM<R, E, A> {
  return new Effect(f);
}

/**
 * Retrieves the environment inside an stm.
 *
 * @tsplus static fncts.io.STMOps environment
 */
export function environment<R>(__tsplusTrace?: string): STM<R, never, Environment<R>> {
  return new Effect((_, __, r) => r);
}

/**
 * Accesses the environment of the transaction.
 *
 * @tsplus static fncts.io.STMOps environmentWith
 */
export function environmentWith<R, A>(f: (r: Environment<R>) => A, __tsplusTrace?: string): STM<R, never, A> {
  return STM.environment<R>().map(f);
}

/**
 * Accesses the environment of the transaction to perform a transaction.
 *
 * @tsplus static fncts.io.STMOps environmentWithSTM
 */
export function environmentWithSTM<R0, R, E, A>(f: (r: Environment<R0>) => STM<R, E, A>, __tsplusTrace?: string) {
  return STM.environment<R0>().flatMap(f);
}

/**
 * Returns an `STM` effect whose failure and success channels have been mapped by
 * the specified pair of functions, `f` and `g`.
 *
 * @tsplus pipeable fncts.io.STM bimap
 */
export function bimap<E, A, E1, B>(g: (e: E) => E1, f: (a: A) => B, __tsplusTrace?: string) {
  return <R>(self: STM<R, E, A>) =>
    self.matchSTM(
      (e) => STM.failNow(g(e)),
      (a) => STM.succeedNow(f(a)),
    );
}

/**
 * Recovers from specified error.
 *
 * @tsplus pipeable fncts.io.STM catch
 */
export function catchWith<N extends keyof E, K extends E[N] & string, E, R1, E1, A1>(
  tag: N,
  k: K,
  f: (
    e: Extract<
      E,
      {
        [n in N]: K;
      }
    >,
  ) => STM<R1, E1, A1>,
  __tsplusTrace?: string,
) {
  return <R, A>(
    stm: STM<R, E, A>,
  ): STM<
    R | R1,
    | Exclude<
        E,
        {
          [n in N]: K;
        }
      >
    | E1,
    A | A1
  > => {
    return stm.catchAll((e) => {
      if (isObject(e) && tag in e && e[tag] === k) {
        return f(e as any);
      }
      return STM.failNow(e as any);
    });
  };
}

/**
 * Recovers from some or all of the error cases.
 *
 * @tsplus pipeable fncts.io.STM catchJust
 */
export function catchJust<E, R1, E1, B>(f: (e: E) => Maybe<STM<R1, E1, B>>, __tsplusTrace?: string) {
  return <R, A>(stm: STM<R, E, A>): STM<R1 | R, E | E1, A | B> => {
    return stm.catchAll((e): STM<R1, E | E1, A | B> => f(e).getOrElse(STM.failNow(e)));
  };
}

/**
 * Recovers from specified error.
 *
 * @tsplus pipeable fncts.io.STM catchTag
 */
export function catchTag<
  K extends E["_tag"] & string,
  E extends {
    _tag: string;
  },
  R1,
  E1,
  A1,
>(
  k: K,
  f: (
    e: Extract<
      E,
      {
        _tag: K;
      }
    >,
  ) => STM<R1, E1, A1>,
  __tsplusTrace?: string,
) {
  return <R, A>(
    stm: STM<R, E, A>,
  ): STM<
    R | R1,
    | Exclude<
        E,
        {
          _tag: K;
        }
      >
    | E1,
    A | A1
  > => {
    return stm.catchAll((e) => {
      if ("_tag" in e && e["_tag"] === k) {
        return f(e as any);
      }
      return STM.failNow(e as any);
    });
  };
}

/**
 * Creates a composite effect that represents this effect followed by another
 * one that may depend on the error produced by this one.
 *
 * @tsplus pipeable fncts.io.STM flatMapError
 */
export function chainError<E, R2, E2>(f: (e: E) => STM<R2, never, E2>, __tsplusTrace?: string) {
  return <R, A>(stm: STM<R, E, A>): STM<R2 | R, E2, A> => {
    return stm.swapWith((effect) => effect.flatMap(f));
  };
}

/**
 * Checks the condition, and if it's true, returns unit, otherwise, retries.
 *
 * @tsplus static fncts.io.STMOps check
 */
export function check(predicate: () => boolean, __tsplusTrace?: string): STM<never, never, void> {
  return STM.defer(() => (predicate() ? STM.unit : STM.retry));
}

/**
 * Commits this transaction atomically, regardless of whether the transaction
 * is a success or a failure.
 */
export function commitEither<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return stm.either.commit.absolve;
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * succeed with the returned value.
 *
 * @tsplus pipeable fncts.io.STM continueOrFail
 */
export function continueOrFail<E1, A, A2>(e: Lazy<E1>, pf: (a: A) => Maybe<A2>, __tsplusTrace?: string) {
  return <R, E>(fa: STM<R, E, A>): STM<R, E | E1, A2> => {
    return fa.continueOrFailSTM(e, (a) => pf(a).map(STM.succeedNow));
  };
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * continue with the returned value.
 *
 * @tsplus pipeable fncts.io.STM continueOrFailSTM
 */
export function continueOrFailSTM<E1, A, R2, E2, A2>(
  e: Lazy<E1>,
  pf: (a: A) => Maybe<STM<R2, E2, A2>>,
  __tsplusTrace?: string,
) {
  return <R, E>(fa: STM<R, E, A>): STM<R2 | R, E | E1 | E2, A2> => {
    return fa.flatMap((a) => pf(a).getOrElse(STM.fail(e)));
  };
}

/**
 * Fail with `e` if the supplied `PartialFunction` does not match, otherwise
 * succeed with the returned value.
 *
 * @tsplus pipeable fncts.io.STM continueOrRetry
 */
export function continueOrRetry<A, A2>(pf: (a: A) => Maybe<A2>, __tsplusTrace?: string) {
  return <R, E>(fa: STM<R, E, A>): STM<R, E, A2> => {
    return fa.continueOrRetrySTM((a) => pf(a).map(STM.succeedNow));
  };
}

/**
 * Simultaneously filters and flatMaps the value produced by this effect.
 * Continues on the effect returned from pf.
 *
 * @tsplus pipeable fncts.io.STM continueOrRetrySTM
 */
export function continueOrRetrySTM<A, R2, E2, A2>(pf: (a: A) => Maybe<STM<R2, E2, A2>>, __tsplusTrace?: string) {
  return <R, E>(fa: STM<R, E, A>): STM<R2 | R, E | E2, A2> => {
    return fa.flatMap((a) => pf(a).getOrElse(STM.retry));
  };
}

/**
 * Suspends creation of the specified transaction lazily.
 *
 * @tsplus static fncts.io.STMOps defer
 */
export function defer<R, E, A>(make: Lazy<STM<R, E, A>>, __tsplusTrace?: string): STM<R, E, A> {
  return STM.succeed(make).flatten;
}

/**
 * Converts the failure channel into an `Either`.
 *
 * @tsplus getter fncts.io.STM either
 */
export function either<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): STM<R, never, Either<E, A>> {
  return stm.match(Either.left, Either.right);
}

/**
 * Returns an effect that ignores errors and runs repeatedly until it eventually succeeds.
 *
 * @tsplus getter fncts.io.STM eventually
 */
export function eventually<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): STM<R, never, A> {
  return stm.matchSTM(() => stm.eventually, STM.succeedNow);
}

/**
 * Simultaneously filters and maps the value produced by this effect.
 *
 * @tsplus pipeable fncts.io.STM filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>, __tsplusTrace?: string) {
  return <R, E>(stm: STM<R, E, A>): STM<R, E, B> => {
    return stm.filterMapSTM((a) => f(a).map(STM.succeedNow));
  };
}

/**
 * Simultaneously filters and chains the value produced by this effect.
 * Continues on the effect returned from f.
 *
 * @tsplus pipeable fncts.io.STM filterMapSTM
 */
export function filterMapSTM<A, R1, E1, B>(f: (a: A) => Maybe<STM<R1, E1, B>>, __tsplusTrace?: string) {
  return <R, E>(self: STM<R, E, A>): STM<R | R1, E | E1, B> => {
    return self.matchSTM(STM.failNow, (a) => f(a).getOrElse(STM.retry));
  };
}

/**
 * Applies `or` if the predicate fails.
 *
 * @tsplus pipeable fncts.io.STM filterOrElse
 */
export function filterOrElse<A, B extends A, R2, E2, A2>(
  p: Refinement<A, B>,
  or: (a: Exclude<A, B>) => STM<R2, E2, A2>,
): <R, E>(fa: STM<R, E, A>) => STM<R | R2, E | E2, B | A2>;
export function filterOrElse<A, R2, E2, A2>(
  p: Predicate<A>,
  or: (a: A) => STM<R2, E2, A2>,
): <R, E>(fa: STM<R, E, A>) => STM<R | R2, E | E2, A | A2>;
export function filterOrElse<A>(p: Predicate<A>, or: unknown, __tsplusTrace?: string) {
  return <R, E, R2, E2, A2>(fa: STM<R, E, A>): STM<R | R2, E | E2, A | A2> => {
    return fa.flatMap((a) => (p(a) ? STM.succeedNow(a) : STM.defer((or as (a: A) => STM<R2, E2, A2>)(a))));
  };
}

/**
 * Fails with `failWith` if the predicate fails.
 *
 * @tsplus pipeable fncts.io.STM filterOrFail
 */
export function filterOrFail<E1, A, B extends A>(
  p: Refinement<A, B>,
  failWith: (a: Exclude<A, B>) => E1,
): <R, E>(fa: STM<R, E, A>) => STM<R, E | E1, B>;
export function filterOrFail<E1, A>(
  p: Predicate<A>,
  failWith: (a: A) => E1,
): <R, E>(fa: STM<R, E, A>) => STM<R, E | E1, A>;
export function filterOrFail<A>(p: Predicate<A>, failWith: unknown, __tsplusTrace?: string) {
  return <R, E, E1>(fa: STM<R, E, A>): STM<R, E | E1, A> => {
    return fa.filterOrElse(p, (a) => STM.fail((failWith as (a: A) => E1)(a)));
  };
}

/**
 * Halts with specified `unknown` if the predicate fails.
 *
 * @tsplus pipeable fncts.io.STM filterOrHalt
 */
export function filterOrHalt<A, B extends A>(
  p: Refinement<A, B>,
  haltWith: (a: Exclude<A, B>) => unknown,
): <R, E>(fa: STM<R, E, A>) => STM<R, E, B>;
export function filterOrHalt<A>(p: Predicate<A>, haltWith: (a: A) => unknown): <R, E>(fa: STM<R, E, A>) => STM<R, E, A>;
export function filterOrHalt<A>(p: Predicate<A>, haltWith: unknown, __tsplusTrace?: string) {
  return <R, E>(fa: STM<R, E, A>): STM<R, E, A> => {
    return fa.filterOrElse(p, (a) => STM.halt((haltWith as (a: A) => unknown)(a)));
  };
}

/**
 * Flattens out a nested `STM` effect.
 *
 * @tsplus getter fncts.io.STM flatten
 */
export function flatten<R, E, R1, E1, B>(
  stm: STM<R, E, STM<R1, E1, B>>,
  __tsplusTrace?: string,
): STM<R1 | R, E | E1, B> {
  return stm.flatMap(identity);
}

/**
 * Unwraps the optional error, defaulting to the provided value.
 *
 * @tsplus pipeable fncts.io.STM flattenErrorOption
 */
export function flattenErrorOption<E2>(def: Lazy<E2>, __tsplusTrace?: string) {
  return <R, E, A>(stm: STM<R, Maybe<E>, A>): STM<R, E | E2, A> => {
    return stm.mapError((me) => me.getOrElse(def));
  };
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns a transactional effect that produces a new `ReadonlyArray<B>`.
 *
 * @tsplus static fncts.io.STMOps foreach
 */
export function foreach<A, R, E, B>(
  it: Iterable<A>,
  f: (a: A) => STM<R, E, B>,
  __tsplusTrace?: string,
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
 * @tsplus static fncts.io.STMOps fromEither
 */
export function fromEither<E, A>(e: Lazy<Either<E, A>>, __tsplusTrace?: string): STM<never, E, A> {
  return STM.defer(e().match({ Left: STM.failNow, Right: STM.succeedNow }));
}

/**
 * Lifts an `Either` into a `STM`.
 *
 * @tsplus static fncts.io.STMOps fromEitherNow
 */
export function fromEitherNow<E, A>(e: Either<E, A>, __tsplusTrace?: string): STM<never, E, A> {
  return e.match({ Left: STM.failNow, Right: STM.succeedNow });
}

/**
 * Unwraps the optional success of this effect, but can fail with an None value.
 */
export function get<R, E, A>(stm: STM<R, E, Maybe<A>>, __tsplusTrace?: string): STM<R, Maybe<E>, A> {
  return stm.matchSTM(
    (e) => STM.failNow(Just(e)),
    (ma) => ma.match(() => STM.failNow(Nothing()), STM.succeedNow),
  );
}

/**
 * Provides the transaction its required environment, which eliminates
 * its dependency on `R`.
 *
 * @tsplus pipeable fncts.io.STM provideEnvironment
 */
export function provideEnvironment<R>(r: Environment<R>, __tsplusTrace?: string) {
  return <E, A>(stm: STM<R, E, A>): STM<never, E, A> => {
    return stm.contramapEnvironment(() => r);
  };
}

/**
 * Provides some of the environment required to run this effect,
 * leaving the remainder `R0`.
 *
 * @tsplus pipeable fncts.io.STM contramapEnvironment
 */
export function contramapEnvironment<R, R0>(f: (r: Environment<R0>) => Environment<R>, __tsplusTrace?: string) {
  return <E, A>(self: STM<R, E, A>): STM<R0, E, A> => {
    return new ContramapEnvironment(self, f);
  };
}

/**
 * Halts the fiber running the effect.
 *
 * @tsplus static fncts.io.STMOps halt
 */
export function halt(u: Lazy<unknown>, __tsplusTrace?: string): STM<never, never, never> {
  return new Effect(() => {
    throw new HaltException(u());
  });
}

/**
 * Halts the fiber running the effect.
 *
 * @tsplus static fncts.io.STMOps haltNow
 */
export function haltNow(u: unknown, __tsplusTrace?: string): STM<never, never, never> {
  return new Effect(() => {
    throw new HaltException(u);
  });
}

/**
 * Returns a successful effect with the head of the list if the list is
 * non-empty or fails with the error `None` if the list is empty.
 *
 * @tsplus getter fncts.io.STM head
 */
export function head<R, E, A>(stm: STM<R, E, Iterable<A>>, __tsplusTrace?: string): STM<R, Maybe<E>, A> {
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
 * @tsplus static fncts.io.STMOps interrupt
 */
export const interrupt: STM<never, never, never> = STM.fiberId.flatMap((id) => STM.interruptAs(id));

/**
 * Returns whether this effect is a failure.
 *
 * @tsplus getter fncts.io.STM isFailure
 */
export function isFailure<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string) {
  return stm.match(
    () => true,
    () => false,
  );
}

/**
 * Returns whether this effect is a success.
 *
 * @tsplus getter fncts.io.STM isSuccess
 */
export function isSuccess<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string) {
  return stm.match(
    () => false,
    () => true,
  );
}

/**
 * Returns a successful effect if the value is `Left`, or fails with the error `None`.
 *
 * @tsplus getter fncts.io.STM left
 */
export function left<R, E, B, C>(stm: STM<R, E, Either<B, C>>, __tsplusTrace?: string): STM<R, Maybe<E>, B> {
  return stm.matchSTM(
    (e) => STM.fail(Just(e)),
    (bc) => bc.match({ Left: STM.succeedNow, Right: () => STM.failNow(Nothing()) }),
  );
}

/**
 * Returns a successful effect if the value is `Left`, or fails with the error e.
 *
 * @tsplus pipeable fncts.io.STM leftOrFail
 */
export function leftOrFail<C, E1>(orFail: (c: C) => E1, __tsplusTrace?: string) {
  return <R, E, B>(stm: STM<R, E, Either<B, C>>): STM<R, E | E1, B> => {
    return stm.flatMap((bc) => bc.match({ Left: STM.succeedNow, Right: (c) => STM.fail(orFail(c)) }));
  };
}

/**
 * Maps from one error type to another.
 *
 * @tsplus pipeable fncts.io.STM mapError
 */
export function mapError<E, E1>(f: (a: E) => E1, __tsplusTrace?: string) {
  return <R, A>(stm: STM<R, E, A>): STM<R, E1, A> => {
    return stm.matchSTM((e) => STM.failNow(f(e)), STM.succeedNow);
  };
}

/**
 * Folds over the `STM` effect, handling both failure and success, but not
 * retry.
 *
 * @tsplus pipeable fncts.io.STM match
 */
export function match<E, A, B, C>(g: (e: E) => C, f: (a: A) => B, __tsplusTrace?: string) {
  return <R>(stm: STM<R, E, A>): STM<R, never, B | C> => {
    return stm.matchSTM(
      (e) => STM.succeedNow(g(e)),
      (a) => STM.succeedNow(f(a)),
    );
  };
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
 * @tsplus pipeable fncts.io.STM repeatUntil
 */
export function repeatUntil<A>(f: (a: A) => boolean, __tsplusTrace?: string) {
  return <R, E>(stm: STM<R, E, A>): STM<R, E, A> => {
    return stm.flatMap((a) => (f(a) ? STM.succeedNow(a) : stm.repeatUntil(f)));
  };
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
 * @tsplus pipeable fncts.io.STM repeatWhile
 */
export function repeatWhile<A>(f: (a: A) => boolean, __tsplusTrace?: string) {
  return <R, E>(stm: STM<R, E, A>): STM<R, E, A> => {
    return stm.flatMap((a) => (f(a) ? stm.repeatWhile(f) : STM.succeedNow(a)));
  };
}

/**
 * Returns an effect that swaps the error/success cases. This allows you to
 * use all methods on the error channel, possibly before flipping back.
 *
 * @tsplus getter fncts.io.STM swap
 */
export function swap<R, E, A>(stm: STM<R, E, A>, __tsplusTrace?: string): STM<R, A, E> {
  return stm.matchSTM(STM.succeedNow, STM.failNow);
}

/**
 * Swaps the error/value parameters, applies the function `f` and flips the parameters back
 *
 * @tsplus pipeable fncts.io.STM swapWith
 */
export function swapWith<R, E, A, R2, E2, A2>(f: (stm: STM<R, A, E>) => STM<R2, A2, E2>, __tsplusTrace?: string) {
  return (stm: STM<R, E, A>): STM<R2, E2, A2> => {
    return f(stm.swap).swap;
  };
}

/**
 * "Peeks" at the success of transactional effect.
 *
 * @tsplus pipeable fncts.io.STM tap
 */
export function tap<A, R1, E1, B>(f: (a: A) => STM<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E>(stm: STM<R, E, A>): STM<R1 | R, E | E1, A> => {
    return stm.flatMap((a) => f(a).as(a));
  };
}

/**
 * Returns an effect with the value on the left part.
 *
 * @tsplus static fncts.io.STMOps toLeft
 */
export function toLeft<A>(a: Lazy<A>, __tsplusTrace?: string): STM<never, never, Either<A, never>> {
  return STM.succeed(a).flatMap((a) => STM.succeedNow(Either.left(a)));
}

/**
 * Returns an `STM` effect that succeeds with `Unit`.
 *
 * @tsplus static fncts.io.STMOps unit
 */
export const unit = STM.succeedNow<void>(undefined);

/**
 * Sequentially zips this value with the specified one, combining the values
 * using the specified combiner function.
 *
 * @tsplus pipeable fncts.io.STM zipWith
 */
export function zipWith<A, R1, E1, B, C>(that: STM<R1, E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: STM<R, E, A>): STM<R | R1, E | E1, C> => {
    return self.flatMap((a) => that.map((b) => f(a, b)));
  };
}

/**
 * @tsplus pipeable fncts.io.STM zipLeft
 * @tsplus opipeable-operator fncts.io.STM <
 */
export function zipLeft<R1, E1, B>(that: STM<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: STM<R, E, A>): STM<R | R1, E | E1, A> => {
    return self.flatMap((a) => that.as(a));
  };
}

/**
 * @tsplus pipeable fncts.io.STM zipRight
 * @tsplus pipeable-operator fncts.io.STM >
 */
export function zipRight<R1, E1, B>(that: STM<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: STM<R, E, A>): STM<R | R1, E | E1, B> => {
    return self.flatMap(() => that);
  };
}
