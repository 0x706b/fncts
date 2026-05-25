---
name: testing-base
description: Testing patterns and conventions for packages/base tests
---

# Testing Base Package

## Overview

Tests in `@fncts/base` use a custom testing layer over Vitest. Assertions are expressed through a pipeable `.assert()` method on values, combined with assertion-building helpers. Suites run concurrently by default and property-based testing is woven in via `Gen` generators.

## Key Patterns

### 1. Globals and Imports

Testing globals (`suite`, `test`) are provided by `@fncts/test` wrapping Vitest. Extension methods from `@fncts/base` and `@fncts/io` are loaded via ambient type imports.

```ts
import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";
```

Vitest helpers like `vitest.fn` can be imported when needed:

```ts
import { vitest } from "vitest";
```

### 2. Suite and Test Structure

- Always use **`suite.concurrent`** (not plain `describe`) to let tests run in parallel.
- Nest suites by the method or feature under test.
- Name tests descriptively: the condition being tested.

```ts
suite.concurrent("Vector", () => {
  suite.concurrent("empty", () => {
    test("empty", Vector.empty<number>().assert(strictEqualTo(Vector.empty())));
  });

  suite.concurrent("append", () => {
    test(
      "append to empty",
      Vector.empty<number>()
        .append(1)
        .assert(strictEqualTo(Vector(1))),
    );
  });
});
```

### 3. Assertion Style

Use the pipeable `.assert()` method on values. Do **not** use Vitest's `expect()`.

```ts
value.assert(assertion)
```

Common assertion helpers:

| Assertion | Meaning |
|---|---|
| `strictEqualTo(expected)` | Referential / `Equatable` equality |
| `deepEqualTo(expected)` | Deep structural equality |
| `isTrue` | Boolean is `true` |
| `isFalse` | Boolean is `false` |
| `isJust(inner)` | `Maybe` is `Just` matching `inner` |
| `isNothing` | `Maybe` is `Nothing` |
| `calledTimes(n)` | Vitest mock called exactly `n` times |
| `every(assertion)` | Every element in a collection matches |

Combine assertions in a single test with `&&`:

```ts
test("both conditions", condition1.assert(isTrue) && condition2.assert(isFalse));
```

Negate an assertion with `.invert`:

```ts
Vector(1, 2, 3).assert(strictEqualTo(Vector(1, 2, 3, 4)).invert);
```

### 4. Property-Based Testing

Use `Gen` generators inside a `test.io` block with `.check()`.

```ts
suite.concurrent("property-based", () => {
  test.io(
    "reverse is involution",
    Gen.int.array.check((as) => {
      const list = List.from(as);
      return list.reverse.reverse.assert(strictEqualTo(list));
    }),
  );
});
```

Common `Gen` patterns:

- `Gen.int.array` – arrays of ints
- `Gen.int.array.check(fn)` – check a property over arrays
- `Gen.int.conc` – generated `Conc` values
- `Gen.intWith({ min, max })` – bounded ints
- `Gen.int.array.zip(Gen.int.array)` – two related inputs

### 5. IO Tests

When testing `IO` values or effects, use `test.io` and `.assertIO`:

```ts
import type {} from "@fncts/io/global";

test.io(
  "buffer used",
  Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
    const effect = IO.succeed(bs.foldLeft(as, (acc, a) => acc.append(a)));
    const actual = IO.allConcurrent(Iterable.replicate(100, effect));
    const expected = as.concat(bs);
    return actual.assertIO(every(strictEqualTo(expected)));
  }),
  { timeout: 20_000 },
);
```

### 6. Custom Test Helpers

Define local helpers at the top of a test file when they reduce boilerplate:

```ts
function Q<A>(...as: A[]): ImmutableQueue<A> {
  let q = ImmutableQueue.empty<A>();
  for (const a of as) {
    q = q.enqueue(a);
  }
  return q;
}
```

### 7. Mutation / Immutability Tests

When testing mutable variants vs immutable results, assert that the original is unchanged:

```ts
test("append preserves original", () => {
  const original = Vector(1, 2);
  const appended = original.append(3);
  return original.assert(strictEqualTo(Vector(1, 2)));
});
```

### 8. Tuple / Destructured Results

When a function returns a tuple or pair, use `deepEqualTo` with an explicit `as const`:

```ts
test(
  "splitAt middle",
  Vector(1, 2, 3, 4, 5)
    .splitAt(2)
    .assert(deepEqualTo([Vector(1, 2), Vector(3, 4, 5)] as const)),
);
```

## Simple Rules

1. **Use `suite.concurrent`**, not `describe`.
2. **Use `.assert()`** with `strictEqualTo`, `deepEqualTo`, `isTrue`, `isFalse`, etc. Never use `expect()`.
3. **Group tests by method** in nested suites.
4. **Cover empty, single, and multiple** element cases for collection methods.
5. **Combine assertions** with `&&` when multiple conditions are checked in one test.
6. **Use `test.io` + `Gen`** for property-based tests.
7. **Import global type side-effects** (`@fncts/base/global`, `@fncts/io/global`) so extension methods are available.
8. **Use `deepEqualTo` for arrays and tuples**, `strictEqualTo` for values with custom equality.
9. **Prefer inline expressions** over multi-line test bodies for simple cases; use arrow functions only when side effects or setup are needed.
