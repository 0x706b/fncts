import { vitest } from "vitest";

suite.concurrent("AsyncIterable", () => {
  suite.concurrent("constructors", () => {
    test.io(
      "make is lazy and repeatable",
      IO.fromPromise(async () => {
        const makeIterator = vitest.fn(() => {
          let index = 0;
          return {
            async next() {
              return index < 3 ? { done: false, value: index++ } : { done: true, value: undefined };
            },
          };
        });
        const iterable = AsyncIterable(makeIterator);
        const before   = makeIterator.mock.calls.length;
        const first    = await toArray(iterable);
        const second   = await toArray(iterable);
        const after    = makeIterator.mock.calls.length;

        return { after, before, first, second };
      }).assertIO(deepEqualTo({ after: 2, before: 0, first: [0, 1, 2], second: [0, 1, 2] })),
    );

    test.io(
      "from converts a synchronous iterable",
      IO.fromAsyncIterable(AsyncIterable.from([1, 2, 3])).assertIO(deepEqualTo(Conc(1, 2, 3))),
    );

    test.io(
      "from converts an empty iterable",
      IO.fromAsyncIterable(AsyncIterable.from([] as Array<number>)).assertIO(deepEqualTo(Conc())),
    );

    test.io(
      "from calls the source iterator return on early termination",
      IO.fromPromise(async () => {
        const finalize = vitest.fn();

        function* source() {
          try {
            yield 1;
            yield 2;
          } finally {
            finalize();
          }
        }

        const values: Array<number> = [];
        for await (const value of AsyncIterable.from(source())) {
          values.push(value);
          break;
        }

        return { finalizeCalls: finalize.mock.calls.length, values };
      }).assertIO(deepEqualTo({ finalizeCalls: 1, values: [1] })),
    );

    test.io(
      "fromValues creates an iterable from variadic values",
      IO.fromAsyncIterable(AsyncIterable.fromValues(1, 2, 3)).assertIO(deepEqualTo(Conc(1, 2, 3))),
    );
  });

  suite.concurrent("map", () => {
    test.io(
      "maps every value",
      IO.fromAsyncIterable(AsyncIterable.from([1, 2, 3]).map((n) => n * 2)).assertIO(deepEqualTo(Conc(2, 4, 6))),
    );

    test.io(
      "maps an empty iterable",
      IO.fromAsyncIterable(AsyncIterable.from([] as Array<number>).map((n) => n * 2)).assertIO(deepEqualTo(Conc())),
    );

    test.io(
      "is lazy",
      IO.fromPromise(async () => {
        const f = vitest.fn((n: number) => n * 2);

        const iterable = AsyncIterable.from([1, 2, 3]).map(f);
        const before   = f.mock.calls.length;
        const values   = await toArray(iterable);
        const after    = f.mock.calls.length;

        return { after, before, values };
      }).assertIO(deepEqualTo({ after: 3, before: 0, values: [2, 4, 6] })),
    );

    test.io(
      "returns the source on early termination",
      IO.fromPromise(async () => {
        const source = trackedAsyncIterable([1, 2, 3]);

        for await (const _ of source.iterable.map((n) => n * 2)) {
          break;
        }

        return source.returned();
      }).assertIO(strictEqualTo(1)),
    );
  });

  suite.concurrent("mapWithIndex", () => {
    test.io(
      "maps values with zero-based indices",
      IO.fromAsyncIterable(AsyncIterable.from(["a", "b", "c"]).mapWithIndex((i, value) => `${i}:${value}`)).assertIO(
        deepEqualTo(Conc("0:a", "1:b", "2:c")),
      ),
    );
  });

  suite.concurrent("mapPromise", () => {
    test.io(
      "maps every value with a promise",
      IO.fromAsyncIterable(AsyncIterable.from([1, 2, 3]).mapPromise(async (n) => n * 2)).assertIO(
        deepEqualTo(Conc(2, 4, 6)),
      ),
    );
  });

  suite.concurrent("mapPromiseWithIndex", () => {
    test.io(
      "maps values with indices and promises",
      IO.fromAsyncIterable(
        AsyncIterable.from(["a", "b"]).mapPromiseWithIndex(async (i, value) => `${i}:${value}`),
      ).assertIO(deepEqualTo(Conc("0:a", "1:b"))),
    );
  });

  suite.concurrent("filter", () => {
    test.io(
      "keeps matching values",
      IO.fromAsyncIterable(AsyncIterable.from([1, 2, 3, 4]).filter((n) => n % 2 === 0)).assertIO(
        deepEqualTo(Conc(2, 4)),
      ),
    );

    test.io(
      "keeps all matching values",
      IO.fromAsyncIterable(AsyncIterable.from([2, 4, 6]).filter((n) => n % 2 === 0)).assertIO(
        deepEqualTo(Conc(2, 4, 6)),
      ),
    );

    test.io(
      "returns empty when no values match",
      IO.fromAsyncIterable(AsyncIterable.from([1, 3, 5]).filter((n) => n % 2 === 0)).assertIO(deepEqualTo(Conc())),
    );
  });

  suite.concurrent("filterWithIndex", () => {
    test.io(
      "filters values with zero-based indices",
      IO.fromAsyncIterable(AsyncIterable.from(["a", "b", "c", "d"]).filterWithIndex((i) => i % 2 === 0)).assertIO(
        deepEqualTo(Conc("a", "c")),
      ),
    );

    test.io(
      "returns the source on early termination",
      IO.fromPromise(async () => {
        const source = trackedAsyncIterable([1, 2, 3]);

        for await (const _ of source.iterable.filterWithIndex((_, n) => n > 1)) {
          break;
        }

        return source.returned();
      }).assertIO(strictEqualTo(1)),
    );
  });

  suite.concurrent("filterMapWithIndex", () => {
    test.io(
      "filters and maps Just values",
      IO.fromAsyncIterable(
        AsyncIterable.from([1, 2, 3, 4]).filterMapWithIndex((i, n) => (n % 2 === 0 ? Just(`${i}:${n}`) : Nothing())),
      ).assertIO(deepEqualTo(Conc("1:2", "3:4"))),
    );

    test.io(
      "returns empty when every value maps to Nothing",
      IO.fromAsyncIterable(AsyncIterable.from([1, 2, 3]).filterMapWithIndex(() => Nothing<number>())).assertIO(
        deepEqualTo(Conc()),
      ),
    );
  });

  suite.concurrent("zipWith", () => {
    test.io(
      "zips values pairwise",
      IO.fromAsyncIterable(
        AsyncIterable.from([1, 2, 3]).zipWith(AsyncIterable.from([4, 5, 6]), (a, b) => a + b),
      ).assertIO(deepEqualTo(Conc(5, 7, 9))),
    );

    test.io(
      "stops at the shorter iterable",
      IO.fromAsyncIterable(
        AsyncIterable.from([1, 2, 3]).zipWith(AsyncIterable.from(["a"]), (a, b) => `${a}:${b}`),
      ).assertIO(deepEqualTo(Conc("1:a"))),
    );

    test.io(
      "returns both sources on early termination",
      IO.fromPromise(async () => {
        const left = trackedAsyncIterable([1, 2, 3]);

        const right = trackedAsyncIterable([4, 5, 6]);

        for await (const _ of left.iterable.zipWith(right.iterable, (a, b) => a + b)) {
          break;
        }

        return { left: left.returned(), right: right.returned() };
      }).assertIO(deepEqualTo({ left: 1, right: 1 })),
    );
  });

  suite.concurrent("zipWithPromise", () => {
    test.io(
      "zips values pairwise with a promise",
      IO.fromAsyncIterable(
        AsyncIterable.from([1, 2, 3]).zipWithPromise(AsyncIterable.from([4, 5, 6]), async (a, b) => a + b),
      ).assertIO(deepEqualTo(Conc(5, 7, 9))),
    );

    test.io(
      "stops at the shorter iterable",
      IO.fromAsyncIterable(
        AsyncIterable.from([1]).zipWithPromise(AsyncIterable.from([4, 5, 6]), async (a, b) => a + b),
      ).assertIO(deepEqualTo(Conc(5))),
    );
  });

  suite.concurrent("foldLeftWithIndex", () => {
    test.io(
      "returns the initial value for an empty iterable",
      IO.fromPromise(() =>
        AsyncIterable.from([] as Array<number>).foldLeftWithIndex(10, (_, acc, n) => acc + n),
      ).assertIO(strictEqualTo(10)),
    );

    test.io(
      "folds values from left to right with indices",
      IO.fromPromise(() =>
        AsyncIterable.from(["a", "b", "c"]).foldLeftWithIndex("", (i, acc, value) => `${acc}${i}:${value};`),
      ).assertIO(strictEqualTo("0:a;1:b;2:c;")),
    );

    test.io(
      "supports promise-like accumulator updates",
      IO.fromPromise(() =>
        AsyncIterable.from([1, 2, 3]).foldLeftWithIndex(0, async (i, acc, n) => acc + i + n),
      ).assertIO(strictEqualTo(9)),
    );
  });
});

async function toArray<A>(iterable: AsyncIterable<A>): Promise<Array<A>> {
  const values: Array<A> = [];
  for await (const value of iterable) {
    values.push(value);
  }
  return values;
}

function trackedAsyncIterable<A>(values: ReadonlyArray<A>) {
  let returned = 0;

  let pulled = 0;

  const iterable = AsyncIterable<A>(() => {
    let index = 0;
    return {
      async next() {
        pulled++;
        return index < values.length ? { done: false, value: values[index++]! } : { done: true, value: undefined };
      },
      async return(value?: unknown) {
        returned++;
        return { done: true, value };
      },
    };
  });

  return {
    iterable,
    pulled: () => pulled,
    returned: () => returned,
  };
}
