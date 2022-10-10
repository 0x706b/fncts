import { identity, tuple } from "../function.js";
import { ExitTag } from "./definition.js";

/**
 * @tsplus pipeable fncts.Exit ap
 */
export function ap<E, A>(fa: Exit<E, A>) {
  return <G, B>(fab: Exit<G, (a: A) => B>): Exit<E | G, B> => {
    return fab.flatMap((f) => fa.map((a) => f(a)));
  };
}

/**
 * @tsplus pipeable fncts.Exit apFirst
 */
export function apFirst<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, A> => {
    return fa.zipWithCause(fb, (a, _) => a, Cause.then);
  };
}

/**
 * @tsplus pipeable fncts.Exit apSecond
 */
export function apSecond<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, B> => {
    return fa.zipWithCause(fb, (_, b) => b, Cause.then);
  };
}

/**
 * @tsplus pipeable fncts.Exit apFirstC
 */
export function apFirstC<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, A> => {
    return fa.zipWithCause(fb, (a, _) => a, Cause.both);
  };
}

/**
 * @tsplus pipeable fncts.Exit apSecondC
 */
export function apSecondC<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, B> => {
    return fa.zipWithCause(fb, (_, b) => b, Cause.both);
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
    exits.drop(1).foldLeft(head.map(Conc.single), (acc, el) => acc.zipWithCause(el, (c, a) => c.append(a), Cause.then)),
  );
}

/**
 * @tsplus static fncts.ExitOps collectAllC
 */
export function collectAllC<E, A>(exits: Conc<Exit<E, A>>): Maybe<Exit<E, Conc<A>>> {
  return exits.head.map((head) =>
    exits.drop(1).foldLeft(head.map(Conc.single), (acc, el) => acc.zipWithCause(el, (c, a) => c.append(a), Cause.both)),
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
    return fa.zipWithCause(fb, f, Cause.then);
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
 * @tsplus pipeable fncts.Exit zipWithC
 */
export function zipWithC<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => {
    return fa.zipWithCause(fb, f, Cause.both);
  };
}

/**
 * @tsplus pipeable fncts.Exit zipC
 */
export function zipC<EB, B>(that: Exit<EB, B>) {
  return <EA, A>(self: Exit<EA, A>): Exit<EA | EB, readonly [A, B]> => {
    return self.zipWithC(that, tuple);
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
