import type { Maybe } from "../Maybe";

import { Conc } from "../../collection/immutable/Conc";
import { Cause } from "../Cause";
import { identity } from "../function";
import { Exit, ExitTag } from "./definition";

/**
 * @tsplus fluent fncts.data.Exit ap
 */
export function ap_<E, A, G, B>(
  fab: Exit<G, (a: A) => B>,
  fa: Exit<E, A>
): Exit<E | G, B> {
  return chain_(fab, (f) => map_(fa, (a) => f(a)));
}

/**
 * @tsplus fluent fncts.data.Exit apFirst
 */
export function apFirst_<E, G, A, B>(
  fa: Exit<E, A>,
  fb: Exit<G, B>
): Exit<E | G, A> {
  return fa.zipWithCause(fb, (a, _) => a, Cause.then);
}

/**
 * @tsplus fluent fncts.data.Exit apSecond
 */
export function apSecond_<E, G, A, B>(
  fa: Exit<E, A>,
  fb: Exit<G, B>
): Exit<E | G, B> {
  return fa.zipWithCause(fb, (_, b) => b, Cause.then);
}

/**
 * @tsplus fluent fncts.data.Exit apFirstC
 */
export function apFirstC_<E, G, A, B>(
  fa: Exit<E, A>,
  fb: Exit<G, B>
): Exit<E | G, A> {
  return fa.zipWithCause(fb, (a, _) => a, Cause.both);
}

/**
 * @tsplus fluent fncts.data.Exit apSecondC
 */
export function apSecondC_<E, G, A, B>(
  fa: Exit<E, A>,
  fb: Exit<G, B>
): Exit<E | G, B> {
  return fa.zipWithCause(fb, (_, b) => b, Cause.both);
}

/**
 * @tsplus fluent fncts.data.Exit chain
 */
export function chain_<E, A, G, B>(
  ma: Exit<E, A>,
  f: (a: A) => Exit<G, B>
): Exit<E | G, B> {
  return ma.isFailure() ? ma : f(ma.value);
}

/**
 * @tsplus fluent fncts.data.Exit bimap
 */
export function bimap_<E1, A, E2, B>(
  self: Exit<E1, A>,
  f: (e: E1) => E2,
  g: (a: A) => B
): Exit<E2, B> {
  return self.isFailure()
    ? Exit.failCause(self.cause.map(f))
    : Exit.succeed(g(self.value));
}

/**
 * @tsplus static fncts.data.ExitOps collectAll
 */
export function collectAll<E, A>(
  exits: Conc<Exit<E, A>>
): Maybe<Exit<E, Conc<A>>> {
  return exits.head.map((head) =>
    exits
      .drop(1)
      .foldLeft(head.map(Conc.single), (acc, el) =>
        acc.zipWithCause(el, (c, a) => c.append(a), Cause.then)
      )
  );
}

/**
 * @tsplus static fncts.data.ExitOps collectAllC
 */
export function collectAllC<E, A>(
  exits: Conc<Exit<E, A>>
): Maybe<Exit<E, Conc<A>>> {
  return exits.head.map((head) =>
    exits
      .drop(1)
      .foldLeft(head.map(Conc.single), (acc, el) =>
        acc.zipWithCause(el, (c, a) => c.append(a), Cause.both)
      )
  );
}

/**
 * @tsplus getter fncts.data.Exit flatten
 */
export function flatten<E, G, A>(mma: Exit<E, Exit<G, A>>): Exit<E | G, A> {
  return chain_(mma, identity);
}

/**
 * @tsplus fluent fncts.data.Exit map
 */
export function map_<E, A, B>(fa: Exit<E, A>, f: (a: A) => B): Exit<E, B> {
  return fa.isFailure() ? fa : Exit.succeed(f(fa.value));
}

/**
 * @tsplus fluent fncts.data.Exit mapError
 */
export function mapError_<E1, A, E2>(
  self: Exit<E1, A>,
  f: (e: E1) => E2
): Exit<E2, A> {
  return self.isFailure() ? Exit.failCause(self.cause.map(f)) : self;
}

/**
 * @tsplus fluent fncts.data.Exit mapErrorCause
 */
export function mapErrorCause_<E1, A, E2>(
  self: Exit<E1, A>,
  f: (e: Cause<E1>) => Cause<E2>
): Exit<E2, A> {
  return self.isFailure() ? Exit.failCause(f(self.cause)) : self;
}

/**
 * @tsplus fluent fncts.data.Exit match
 */
export function match_<E, A, B, C>(
  exit: Exit<E, A>,
  onFailure: (e: Cause<E>) => B,
  onSuccess: (a: A) => C
): B | C {
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
 * @tsplus fluent fncts.data.Exit zipWith
 */
export function zipWith_<EA, A, EB, B, C>(
  fa: Exit<EA, A>,
  fb: Exit<EB, B>,
  f: (a: A, b: B) => C
): Exit<EA | EB, C> {
  return fa.zipWithCause(fb, f, Cause.then);
}

/**
 * @tsplus fluent fncts.data.Exit zipWithC
 */
export function zipWithC_<EA, A, EB, B, C>(
  fa: Exit<EA, A>,
  fb: Exit<EB, B>,
  f: (a: A, b: B) => C
): Exit<EA | EB, C> {
  return fa.zipWithCause(fb, f, Cause.both);
}

/**
 * @tsplus fluent fncts.data.Exit zipWithCause
 */
export function zipWithCause_<E, A, G, B, C>(
  fa: Exit<E, A>,
  fb: Exit<G, B>,
  f: (a: A, b: B) => C,
  g: (ea: Cause<E>, eb: Cause<G>) => Cause<E | G>
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

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst ap_
 */
export function ap<E, A>(fa: Exit<E, A>) {
  return <G, B>(fab: Exit<G, (a: A) => B>): Exit<E | G, B> => ap_(fab, fa);
}
/**
 * @tsplus dataFirst apFirst_
 */
export function apFirst<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, A> => apFirst_(fa, fb);
}
/**
 * @tsplus dataFirst apSecond_
 */
export function apSecond<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, B> => apSecond_(fa, fb);
}
/**
 * @tsplus dataFirst apFirstC_
 */
export function apFirstC<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, A> => apFirstC_(fa, fb);
}
/**
 * @tsplus dataFirst apSecondC_
 */
export function apSecondC<G, B>(fb: Exit<G, B>) {
  return <E, A>(fa: Exit<E, A>): Exit<E | G, B> => apSecondC_(fa, fb);
}
/**
 * @tsplus dataFirst chain_
 */
export function chain<A, G, B>(f: (a: A) => Exit<G, B>) {
  return <E>(ma: Exit<E, A>): Exit<E | G, B> => chain_(ma, f);
}
/**
 * @tsplus dataFirst bimap_
 */
export function bimap<E1, A, E2, B>(f: (e: E1) => E2, g: (a: A) => B) {
  return (self: Exit<E1, A>): Exit<E2, B> => bimap_(self, f, g);
}
/**
 * @tsplus dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(fa: Exit<E, A>): Exit<E, B> => map_(fa, f);
}
/**
 * @tsplus dataFirst mapError_
 */
export function mapError<E1, E2>(f: (e: E1) => E2) {
  return <A>(self: Exit<E1, A>): Exit<E2, A> => mapError_(self, f);
}
/**
 * @tsplus dataFirst mapErrorCause_
 */
export function mapErrorCause<E1, E2>(f: (e: Cause<E1>) => Cause<E2>) {
  return <A>(self: Exit<E1, A>): Exit<E2, A> => mapErrorCause_(self, f);
}
/**
 * @tsplus dataFirst match_
 */
export function match<E, A, B, C>(
  onFailure: (e: Cause<E>) => B,
  onSuccess: (a: A) => C
) {
  return (exit: Exit<E, A>): B | C => match_(exit, onFailure, onSuccess);
}
/**
 * @tsplus dataFirst zipWith_
 */
export function zipWith<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => zipWith_(fa, fb, f);
}
/**
 * @tsplus dataFirst zipWithC_
 */
export function zipWithC<A, EB, B, C>(fb: Exit<EB, B>, f: (a: A, b: B) => C) {
  return <EA>(fa: Exit<EA, A>): Exit<EA | EB, C> => zipWithC_(fa, fb, f);
}
/**
 * @tsplus dataFirst zipWithCause_
 */
export function zipWithCause<E, A, G, B, C>(
  fb: Exit<G, B>,
  f: (a: A, b: B) => C,
  g: (ea: Cause<E>, eb: Cause<G>) => Cause<E | G>
) {
  return (fa: Exit<E, A>): Exit<E | G, C> => zipWithCause_(fa, fb, f, g);
}
// codegen:end
