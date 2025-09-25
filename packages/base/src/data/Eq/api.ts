import type { Literal } from "@fncts/typelevel/Any";

import { deriveStruct } from "./derivations.js";

/**
 * @tsplus static fncts.EqOps never
 * @tsplus implicit
 */
export const never: Eq<never> = Eq({ equals: () => () => false });

/**
 * @tsplus static fncts.EqOps strict
 * @tsplus implicit
 */
export const strict: Eq<any> = Eq({ equals: (y) => (x) => x === y });

/**
 * @tsplus static fncts.EqOps string
 * @tsplus implicit
 */
export const string: Eq<string> = Eq.strict;

/**
 * @tsplus static fncts.EqOps number
 * @tsplus implicit
 */
export const number: Eq<number> = Eq.strict;

/**
 * @tsplus static fncts.EqOps boolean
 * @tsplus implicit
 */
export const boolean: Eq<boolean> = Eq.strict;

/**
 * @tsplus static fncts.EqOps symbol
 * @tsplus implicit
 */
export const symbol: Eq<symbol> = Eq.strict;

/**
 * @tsplus getter fncts.Eq nullable
 */
export function nullable<A>(self: Eq<A>): Eq<A | null> {
  return Eq({
    equals: (y) => (x) => {
      if (x === y) {
        return true;
      }
      if (x === null) {
        return false;
      }
      if (y === null) {
        return false;
      }
      return self.equals(y)(x);
    },
  });
}

/**
 * @tsplus getter fncts.Eq undefinable
 */
export function undefinable<A>(self: Eq<A>): Eq<A | undefined> {
  return Eq({
    equals: (y) => (x) => {
      if (x === y) {
        return true;
      }
      if (x === undefined) {
        return false;
      }
      if (y === undefined) {
        return false;
      }
      return self.equals(y)(x);
    },
  });
}

/**
 * @tsplus static fncts.EqOps union
 */
export function union<A extends ReadonlyArray<any>>(eqs: { [K in keyof A]: Eq<A[K]> }): Eq<A[number]> {
  return Eq({
    equals: (y) => (x) => {
      for (const eq of eqs) {
        if (eq.equals(y)(x)) {
          return true;
        }
      }
      return false;
    },
  });
}

/**
 * @tsplus static fncts.EqOps tuple
 */
export function tuple<A extends ReadonlyArray<any>>(eqs: { [K in keyof A]: Eq<A[K]> }): Eq<A> {
  return Eq({
    equals: (y) => (x) => {
      for (let i = 0; i < eqs.length; i++) {
        const eq = eqs[i];
        const xi = x[i];
        const yi = y[i];
        if (!eq.equals(yi)(xi)) {
          return false;
        }
      }
      return true;
    },
  });
}

/**
 * @tsplus static fncts.EqOps record
 */
export function record<K extends PropertyKey, V>(_key: Eq<K>, value: Eq<V>): Eq<Record<K, V>> {
  return Eq({
    equals: (y) => (x) => {
      for (const k in x) {
        if (!(k in y)) {
          return false;
        }
        const xk = x[k];
        const yk = y[k];
        if (!value.equals(yk)(xk)) {
          return false;
        }
      }
      for (const k in y) {
        if (!(k in x)) {
          return false;
        }
      }
      return true;
    },
  });
}

/**
 * @tsplus pipeable fncts.Eq intersection
 */
export function intersection<B>(that: Eq<B>) {
  return <A>(self: Eq<A>): Eq<A & B> => {
    return Eq({
      equals: (y) => (x) => self.equals(y)(x) && that.equals(y)(x),
    });
  };
}

/**
 * @tsplus static fncts.EqOps literal
 */
export function literal<A extends Literal | null>(_: A): Eq<A> {
  return Eq.strict;
}

/**
 * @tsplus static fncts.EqOps struct
 */
export function struct<Required extends Record<PropertyKey, any>, Optional extends Record<PropertyKey, any>>(
  requiredFields: { [K in keyof Required]: Eq<Required[K]> },
  optionalFields?: { [K in keyof Optional]: Eq<Optional[K]> },
): Eq<Required & { [K in keyof Optional]?: Optional[K] }> {
  return Eq({
    equals: (y) => (x) => {
      for (const field in requiredFields) {
        if (!(requiredFields[field] as Eq<any>).equals(y[field])(x[field])) {
          return false;
        }
      }

      if (optionalFields) {
        for (const field in optionalFields) {
          if ((x[field] == null && y[field] != null) || (x[field] != null && y[field] == null)) {
            return false;
          }
          if (!(optionalFields[field] as Eq<any>).equals(y[field])(x[field])) {
            return false;
          }
        }
      }
      return true;
    },
  });
}

/**
 * @tsplus static fncts.EqOps all
 */
export function all<A>(collection: Iterable<Eq<A>>): Eq<ReadonlyArray<A>> {
  return Eq({
    equals: (y) => (x) => {
      const len = Math.min(x.length, y.length);

      let collectionLength = 0;
      for (const eq of collection) {
        if (collectionLength >= len) {
          break;
        }
        if (!eq.equals(y[collectionLength]!)(x[collectionLength]!)) {
          return false;
        }
        collectionLength++;
      }
      return true;
    },
  });
}

/**
 * @tsplus pipeable fncts.Eq contramap
 */
export function contramap<A, B>(f: (b: B) => A) {
  return (self: Eq<A>): Eq<B> => {
    return Eq({ equals: (b2) => (b1) => self.equals(f(b2))(f(b1)) });
  };
}
