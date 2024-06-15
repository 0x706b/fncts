/**
 * @tsplus static fncts.OrdOps all
 */
export function all<A>(collection: Iterable<Ord<A>>): Ord<ReadonlyArray<A>> {
  return Ord<ReadonlyArray<A>>({
    ...Eq.all(collection),
    compare: (y) => (x) => {
      const len = Math.min(x.length, y.length);
      let collectionLength = 0;
      for (const O of collection) {
        if (collectionLength >= len) {
          break;
        }

        const o = O.compare(y[collectionLength]!)(x[collectionLength]!);

        if (o !== Ordering.EQ) {
          return o;
        }
        collectionLength++;
      }
      return Ordering.EQ;
    },
  });
}

/**
 * @tsplus static fncts.OrdOps tuple
 */
export function tuple<T extends ReadonlyArray<Ord<any>>>(
  ...elements: T
): Ord<Readonly<{ [I in keyof T]: [T[I]] extends [Ord<infer A>] ? A : never }>> {
  return Ord.all(elements) as any;
}

/* eslint-disable simple-import-sort/exports */
// codegen:start { preset: barrel, include: api/*.ts }
export * from "./api/min.js";
export * from "./api/max.js";
export * from "./api/contramap.js";
// codegen:end
