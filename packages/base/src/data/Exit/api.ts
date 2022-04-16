import { identity, tuple } from "../function.js";
import { ExitTag } from "./definition.js";

/**
 * @tsplus fluent fncts.Exit ap
 */
export function ap_<E, A, G, B>(fab: Exit<G, (a: A) => B>, fa: Exit<E, A>): Exit<E | G, B> {
  return flatMap_(fab, (f) => map_(fa, (a) => f(a)));
}

/**
 * @tsplus fluent fncts.Exit apFirst
 */
export function apFirst_<E, G, A, B>(fa: Exit<E, A>, fb: Exit<G, B>): Exit<E | G, A> {
  return fa.zipWithCause(fb, (a, _) => a, Cause.then);
}

/**
 * @tsplus fluent fncts.Exit apSecond
 */
export function apSecond_<E, G, A, B>(fa: Exit<E, A>, fb: Exit<G, B>): Exit<E | G, B> {
  return fa.zipWithCause(fb, (_, b) => b, Cause.then);
}

/**
 * @tsplus fluent fncts.Exit apFirstC
 */
export function apFirstC_<E, G, A, B>(fa: Exit<E, A>, fb: Exit<G, B>): Exit<E | G, A> {
  return fa.zipWithCause(fb, (a, _) => a, Cause.both);
}

/**
 * @tsplus fluent fncts.Exit apSecondC
 */
export function apSecondC_<E, G, A, B>(fa: Exit<E, A>, fb: Exit<G, B>): Exit<E | G, B> {
  return fa.zipWithCause(fb, (_, b) => b, Cause.both);
}

/**
 * @tsplus fluent fncts.Exit flatMap
 */
export function flatMap_<E, A, G, B>(ma: Exit<E, A>, f: (a: A) => Exit<G, B>): Exit<E | G, B> {
  return ma.isFailure() ? ma : f(ma.value);
}

/**
 * @tsplus fluent fncts.Exit bimap
 */
export function bimap_<E1, A, E2, B>(self: Exit<E1, A>, f: (e: E1) => E2, g: (a: A) => B): Exit<E2, B> {
  return self.isFailure() ? Exit.failCause(self.cause.map(f)) : Exit.succeed(g(self.value));
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
  return flatMap_(mma, identity);
}

/**
 * @tsplus fluent fncts.Exit map
 */
export function map_<E, A, B>(fa: Exit<E, A>, f: (a: A) => B): Exit<E, B> {
  return fa.isFailure() ? fa : Exit.succeed(f(fa.value));
}

/**
 * @tsplus fluent fncts.Exit mapError
 */
export function mapError_<E1, A, E2>(self: Exit<E1, A>, f: (e: E1) => E2): Exit<E2, A> {
  return self.isFailure() ? Exit.failCause(self.cause.map(f)) : self;
}

/**
 * @tsplus fluent fncts.Exit mapErrorCause
 */
export function mapErrorCause_<E1, A, E2>(self: Exit<E1, A>, f: (e: Cause<E1>) => Cause<E2>): Exit<E2, A> {
  return self.isFailure() ? Exit.failCause(f(self.cause)) : self;
}

/**
 * @tsplus fluent fncts.Exit match
 */
export function match_<E, A, B, C>(exit: Exit<E, A>, onFailure: (e: Cause<E>) => B, onSuccess: (a: A) => C): B | C {
  switch (exit._tag) {
    case ExitTag.Success: {
      return onSuccess(exit.value);
    }
    case ExitTag.Failure: {
      return onFailure(exit.cause);
    }
  }
}

/**
 * @tsplus fluent fncts.Exit zipWith
 */
export function zipWith_<EA, A, EB, B, C>(fa: Exit<EA, A>, fb: Exit<EB, B>, f: (a: A, b: B) => C): Exit<EA | EB, C> {
  return fa.zipWithCause(fb, f, Cause.then);
}

/**
 * @tsplus fluent fncts.Exit zip
 */
export function zip<EA, A, EB, B>(self: Exit<EA, A>, that: Exit<EB, B>): Exit<EA | EB, readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.Exit zipWithC
 */
export function zipWithC_<EA, A, EB, B, C>(fa: Exit<EA, A>, fb: Exit<EB, B>, f: (a: A, b: B) => C): Exit<EA | EB, C> {
  return fa.zipWithCause(fb, f, Cause.both);
}

/**
 * @tsplus fluent fncts.Exit zipC
 */
export function zipC<EA, A, EB, B>(self: Exit<EA, A>, that: Exit<EB, B>): Exit<EA | EB, readonly [A, B]> {
  return self.zipWithC(that, tuple);
}

/**
 * @tsplus fluent fncts.Exit zipWithCause
 */
export function zipWithCause_<E, A, G, B, C>(
  fa: Exit<E, A>,
  fb: Exit<G, B>,
  f: (a: A, b: B) => C,
  g: (ea: Cause<E>, eb: Cause<G>) => Cause<E | G>,
): Exit<E | G, C> {
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
}
