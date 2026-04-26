---
name: ts-plus
description: A description of ts-plus constructs
---

# TS Plus

## Overview

`ts-plus` is a custom modification of the TypeScript type-checker and compiler. It adds features such as:

- extension methods
- tail-call optimization
- global imports
- type-driven operator overloading
- type-driven function overloading
- type-driven value derivation.

Since it is a modification of the TypeScript compiler, LSP features will work as they normally do.

## Constructs

`ts-plus` uses JSDoc tags to communicate with the type-checker.

### `@tsplus type`

```ts
/**
 * @tsplus type [identifier]
 */
```

Registers the symbol as a "type" within the `ts-plus` type system. Can be applied to `type`, `interface`, and `class`.
Extension methods and static values can be attached to instances of the type by referencing the identifier.

#### Example

```ts
/**
 * @tsplus type A
 */
export interface A {
  x: number
}

/**
 * @tsplus pipeable A add
 */
export function add(n: number) {
    return (self: A): A => ({ x: self.x + n })
}

const a0: A = { x: 1 }

// `add` now exists as a callable function on `A`
const a1 = a.add(1) // { x: 2 }
```

### `@tsplus companion`

```ts
/**
 * @tsplus companion [identifier]
 */
```

Registers the symbol as a "companion object" within the `ts-plus` type system. Can be applied to `type`, `interface`,
and `class`. Extension methods and static values can be attached to the symbol itself.

#### Example

```ts
/**
 * @tsplus companion AOps
 */
export interface A {
  x: number
}

/**
 * @tsplus static AOps make
 */
export function make(n: number) {
    return { x: n }
}

// `make` now exists as a static function attached to the symbol `A`
const a = A.make(1) // { x: 1 }
```

### `@tsplus fluent`

```ts
/**
 * @tsplus fluent [identifier] [name]
 */
```

Attaches a fluent-style function to a registered `[identifier]` using the name `[name]`. A fluent-style function is
one that takes the reciever as the first argument.

#### Example

```ts
/**
 * @tsplus type A
 */
export interface A {
  x: number
}

/**
 * @tsplus fluent A add
 */
export function add(self: A, n: number) {
  return { x: self.x + n }
}

const a0: A = { x: 1 }

// `add` now exists as a callable function on instances of `A`
const a1 = a.add(1) // { x: 2 }
```

When compiled, the call will be transformed into:

```ts
const a1 = add(a, 1)
```

### `@tsplus pipeable`

```ts
/**
 * @tsplus fluent [identifier] [name]
 */
```

Attaches a pipeable fluent-style function to a registered `[identifier]` using the name `[name]`.
A pipeable fluent-style function is one that takes the reciever as a final curried argument.

#### Example

```ts
/**
 * @tsplus type A
 */
export interface A {
  x: number
}

/**
 * @tsplus pipeable A add
 */
export function add(n: number) {
    return (self: A): A => ({ x: self.x + n })
}

const a0: A = { x: 1 }

// `add` now exists as a callable function on instances of `A`
const a1 = a.add(1) // { x: 2 }
```

When compiled, the call will be transformed into:

```ts
const a1 = add(1)(a)
```

### `@tsplus static`

```ts
/**
 * @tsplus static [identifier] [name]
 */
```

Attaches a function or value to a registered `[identifier]` using the name `[name]`.

#### Example

```ts
/**
 * @tsplus companion ListOps
 */
export class List {}

/**
 * @tsplus static ListOps empty
 */
export function empty(): List {
  return new List()
}

// `empty` now exists as a callable function on `List`
const a = List.empty()
```

When compiled, the call will be transformed into:

```ts
const a = empty()
```

**Special `static` name "__call"**

`__call` is a special name used to signify that the function should be attached to the call signature of the symbol.

#### Example

```ts
/**
 * @tsplus companion ListOps
 */
export class List {}

/**
 * @tsplus static ListOps __call
 */
export function empty(): List {
  return new List()
}

// `empty` is now attached to the call signature of the `List` symbol
const a = List()
```

When compiled, the call will be transformed into:

```ts
const a = empty()
```

### `@tsplus getter`

```ts
/**
 * @tsplus getter [identifier] [name]
 */
```

Attaches a getter-style function to a registered `[identifier]` using the name `[name]`.

Getter-style functions are ones that take only the reciever as input.

#### Example

```ts
/**
 * @tsplus type Array
 */
export class Array<A> {}

/**
 * @tsplus getter Array head
 */
export function head<A>(self: List<A>): A | undefined {
  return self.head
}

const array = [1, 2, 3]

// `head` now exists as a getter on `Array`
const a = array.head
```

When compiled, the call will be transformed into:

```ts
const a = head(array)
```

### `@tsplus global`

```ts
/**
 * @tsplus global
 */
 import { x } from "@org/module"
```

Makes an import globally available to all sources.