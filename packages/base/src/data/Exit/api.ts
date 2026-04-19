import { IOError } from "@fncts/base/data/exceptions";

import { identity, tuple } from "../function.js";
import { ExitTag } from "./definition.js";

/**
 * Apply a successful function to a successful value.
 *
 * @tsplus pipeable fncts.Exit ap
 */
export function ap<E, A>(that: Exit<E, A>) {
  return <G, B>(self: Exit<G, (a: A) => B>): Exit<E | G, B> => {
    return self.flatMap((f) => that.map((a) => f(a)));
  };
}

/**
 * Map both failure and success channels.
 *
 * @tsplus pipeable fncts.Exit bimap
 */
export function bimap<E1, A, E2, B>(f: (e: E1) => E2, g: (a: A) => B) {
  return (self: Exit<E1, A>): Exit<E2, B> => {
    return self.isFailure() ? Exit.failCause(self.cause.map(f)) : Exit.succeed(g(self.value));
  };
}

/**
 * Return the failure cause or `null` on success.
 *
 * @tsplus getter fncts.Exit causeOrNull
 */
export function causeOrNull<E, A>(self: Exit<E, A>): Cause<E> | null {
  if (self.isFailure()) {
    return self.cause;
  }

  return null;
}

/**
 * Collect exits, combining failures sequentially.
 *
 * @tsplus static fncts.ExitOps collectAll
 */
export function collectAll<E, A>(exits: Conc<Exit<E, A>>): Maybe<Exit<E, Conc<A>>> {
  return exits.head.map((head) =>
    exits
      .drop(1)
      .foldLeft(head.map(Conc.single), (acc, el) => acc.zipWithCause(el, (c, a) => c.append(a), Cause.sequential)),
  );
}

/**
 * Collect exits, combining failures in parallel.
 *
 * @tsplus getter fncts.Conc collectAllConcurrent
 *
 * @tsplus static fncts.ExitOps collectAllConcurrent
 */
export function collectAllConcurrent<E, A>(exits: Conc<Exit<E, A>>): Maybe<Exit<E, Conc<A>>> {
  return exits.head.map((head) =>
    exits
      .drop(1)
      .foldLeft(head.map(Conc.single), (acc, el) => acc.zipWithCause(el, (c, a) => c.append(a), Cause.parallel)),
  );
}

/**
 * Sequence computations, short-circuiting on failure.
 *
 * @tsplus pipeable fncts.Exit flatMap
 */
export function flatMap<A, G, B>(f: (a: A) => Exit<G, B>) {
  return <E>(ma: Exit<E, A>): Exit<E | G, B> => {
    return ma.isFailure() ? ma : f(ma.value);
  };
}

/**
 * Flatten a nested `Exit`.
 *
 * @tsplus getter fncts.Exit flatten
 */
export function flatten<E, G, A>(mma: Exit<E, Exit<G, A>>): Exit<E | G, A> {
  return mma.flatMap(identity);
}

/**
 * Returns the Exit's Success value if it exists, or throws the pretty-printed Cause if it doesn't
 *
 * @tsplus getter fncts.Exit getOrThrow
 */
export function getOrThrow<E, A>(self: Exit<E, A>): A {
  if (self.isFailure()) {
    throw new IOError(self.cause);
  }
  return self.value;
}

/**
 * Map the success channel.
 *
 * @tsplus pipeable fncts.Exit map
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(fa: Exit<E, A>): Exit<E, B> => {
    return fa.isFailure() ? fa : Exit.succeed(f(fa.value));
  };
}

/**
 * Map only the typed error values in the failure cause.
 *
 * @tsplus pipeable fncts.Exit mapError
 */
export function mapError<E1, E2>(f: (e: E1) => E2) {
  return <A>(self: Exit<E1, A>): Exit<E2, A> => {
    return self.isFailure() ? Exit.failCause(self.cause.map(f)) : self;
  };
}

/**
 * Map the full failure cause.
 *
 * @tsplus pipeable fncts.Exit mapErrorCause
 */
export function mapErrorCause<E1, E2>(f: (e: Cause<E1>) => Cause<E2>) {
  return <A>(self: Exit<E1, A>): Exit<E2, A> => {
    return self.isFailure() ? Exit.failCause(f(self.cause)) : self;
  };
}

/**
 * Fold an `Exit` into a single value.
 *
 * @tsplus pipeable fncts.Exit match
 */
export function match<E, A, B, C>(onFailure: (e: Cause<E>) => B, onSuccess: (a: A) => C) {
  return (exit: Exit<E, A>): B | C => {
    switch (exit._tag) {
      case ExitTag.Success: {
        return onSuccess(exit.value);
      }
      case ExitTag.Failure: {
        return onFailure(exit.cause);
      }
    }
  };
}

/**
 * Returns the Exit's Success value if it exists
 *
 * @tsplus getter fncts.Exit value
 */
export function value<E, A>(self: Exit<E, A>): A | undefined {
  if (self.isFailure()) {
    return undefined;
  }
  return self.value;
}

/**
 * Combine two exits into a tuple sequentially.
 *
 * @tsplus pipeable fncts.Exit zip
 */
export function zip<EB, B>(that: Exit<EB, B>) {
  return <EA, A>(self: Exit<EA, A>): Exit<EA | EB, readonly [A, B]> => {
    return self.zipWith(that, tuple);
  };
}

/**
 * Combine two exits into a tuple concurrently.
 *
 * @tsplus pipeable fncts.Exit zipConcurrent
 */
export function zipConcurrent<EB, B>(that: Exit<EB, B>) {
  return <EA, A>(self: Exit<EA, A>): Exit<EA | EB, readonly [A, B]> => {
    return self.zipWithConcurrent(that, tuple);
  };
}

/**
 * Sequence two exits and keep the left success value.
 *
 * @tsplus pipeable fncts.Exit zipLeft
 */
export function zipLeft<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, A> => {
    return self.zipWithCause(that, (a, _) => a, Cause.sequential);
  };
}

/**
 * Run both exits concurrently and keep the left success value.
 *
 * @tsplus pipeable fncts.Exit zipLeftConcurrent
 */
export function zipLeftConcurrent<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, A> => {
    return self.zipWithCause(that, (a, _) => a, Cause.parallel);
  };
}

/**
 * Sequence two exits and keep the right success value.
 *
 * @tsplus pipeable fncts.Exit zipRight
 */
export function zipRight<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, B> => {
    return self.zipWithCause(that, (_, b) => b, Cause.sequential);
  };
}

/**
 * Run both exits concurrently and keep the right success value.
 *
 * @tsplus pipeable fncts.Exit zipRightConcurrent
 */
export function zipRightConcurrent<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, B> => {
    return self.zipWithCause(that, (_, b) => b, Cause.parallel);
  };
}

/**
 * Combine two successful values with `f`, sequentially.
 *
 * @tsplus pipeable fncts.Exit zipWith
 */
export function zipWith<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => {
    return fa.zipWithCause(fb, f, Cause.sequential);
  };
}

/**
 * Combine two exits with custom success and cause combiners.
 *
 * @tsplus pipeable fncts.Exit zipWithCause
 */
export function zipWithCause<E, A, G, B, C>(
  fb: Exit<G, B>,
  f: (a: A, b: B) => C,
  g: (ea: Cause<E>, eb: Cause<G>) => Cause<E | G>,
) {
  return (fa: Exit<E, A>): Exit<E | G, C> => {
    switch (fa._tag) {
      case ExitTag.Failure: {
        switch (fb._tag) {
          case ExitTag.Success: {
            return fa;
          }
          case ExitTag.Failure: {
            return Exit.failCause(g(fa.cause, fb.cause));
          }
        }
      }
      case ExitTag.Success: {
        switch (fb._tag) {
          case ExitTag.Success: {
            return Exit.succeed(f(fa.value, fb.value));
          }
          case ExitTag.Failure: {
            return fb;
          }
        }
      }
    }
  };
}

/**
 * Combine two successful values with `f`, in parallel.
 *
 * @tsplus pipeable fncts.Exit zipWithConcurrent
 */
export function zipWithConcurrent<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => {
    return fa.zipWithCause(fb, f, Cause.parallel);
  };
}
