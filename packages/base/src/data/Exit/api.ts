import { IOError } from "@fncts/base/data/exceptions";

import { identity, tuple } from "../function.js";
import { ExitTag } from "./definition.js";

/**
 * @tsplus pipeable fncts.Exit ap
 */
export function ap<E, A>(that: Exit<E, A>) {
  return <G, B>(self: Exit<G, (a: A) => B>): Exit<E | G, B> => {
    return self.flatMap((f) => that.map((a) => f(a)));
  };
}

/**
 * @tsplus pipeable fncts.Exit zipLeft
 */
export function zipLeft<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, A> => {
    return self.zipWithCause(that, (a, _) => a, Cause.sequential);
  };
}

/**
 * @tsplus pipeable fncts.Exit zipRight
 */
export function zipRight<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, B> => {
    return self.zipWithCause(that, (_, b) => b, Cause.sequential);
  };
}

/**
 * @tsplus pipeable fncts.Exit zipLeftConcurrent
 */
export function zipLeftConcurrent<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, A> => {
    return self.zipWithCause(that, (a, _) => a, Cause.parallel);
  };
}

/**
 * @tsplus pipeable fncts.Exit zipRightConcurrent
 */
export function zipRightConcurrent<G, B>(that: Exit<G, B>) {
  return <E, A>(self: Exit<E, A>): Exit<E | G, B> => {
    return self.zipWithCause(that, (_, b) => b, Cause.parallel);
  };
}

/**
 * @tsplus pipeable fncts.Exit flatMap
 */
export function flatMap<A, G, B>(f: (a: A) => Exit<G, B>) {
  return <E>(ma: Exit<E, A>): Exit<E | G, B> => {
    return ma.isFailure() ? ma : f(ma.value);
  };
}

/**
 * @tsplus pipeable fncts.Exit bimap
 */
export function bimap<E1, A, E2, B>(f: (e: E1) => E2, g: (a: A) => B) {
  return (self: Exit<E1, A>): Exit<E2, B> => {
    return self.isFailure() ? Exit.failCause(self.cause.map(f)) : Exit.succeed(g(self.value));
  };
}

/**
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
 * @tsplus getter fncts.Exit flatten
 */
export function flatten<E, G, A>(mma: Exit<E, Exit<G, A>>): Exit<E | G, A> {
  return mma.flatMap(identity);
}

/**
 * @tsplus pipeable fncts.Exit map
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(fa: Exit<E, A>): Exit<E, B> => {
    return fa.isFailure() ? fa : Exit.succeed(f(fa.value));
  };
}

/**
 * @tsplus pipeable fncts.Exit mapError
 */
export function mapError<E1, E2>(f: (e: E1) => E2) {
  return <A>(self: Exit<E1, A>): Exit<E2, A> => {
    return self.isFailure() ? Exit.failCause(self.cause.map(f)) : self;
  };
}

/**
 * @tsplus pipeable fncts.Exit mapErrorCause
 */
export function mapErrorCause<E1, E2>(f: (e: Cause<E1>) => Cause<E2>) {
  return <A>(self: Exit<E1, A>): Exit<E2, A> => {
    return self.isFailure() ? Exit.failCause(f(self.cause)) : self;
  };
}

/**
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
 * @tsplus pipeable fncts.Exit zipWith
 */
export function zipWith<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => {
    return fa.zipWithCause(fb, f, Cause.sequential);
  };
}

/**
 * @tsplus pipeable fncts.Exit zip
 */
export function zip<EB, B>(that: Exit<EB, B>) {
  return <EA, A>(self: Exit<EA, A>): Exit<EA | EB, readonly [A, B]> => {
    return self.zipWith(that, tuple);
  };
}

/**
 * @tsplus pipeable fncts.Exit zipWithConcurrent
 */
export function zipWithConcurrent<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => {
    return fa.zipWithCause(fb, f, Cause.parallel);
  };
}

/**
 * @tsplus pipeable fncts.Exit zipConcurrent
 */
export function zipConcurrent<EB, B>(that: Exit<EB, B>) {
  return <EA, A>(self: Exit<EA, A>): Exit<EA | EB, readonly [A, B]> => {
    return self.zipWithConcurrent(that, tuple);
  };
}

/**
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
