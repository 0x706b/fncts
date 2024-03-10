# @fncts/io

## 0.0.40

### Patch Changes

- ee4937f: chore: update tsplus
- e1db7aa: fix: optic focus
- 7c9d204: chore: update all dependencies
- e1db7aa: feat: subtype Tag as IO
- Updated dependencies [ee4937f]
- Updated dependencies [e1db7aa]
- Updated dependencies [0a3d758]
- Updated dependencies [7c9d204]
- Updated dependencies [e1db7aa]
  - @fncts/base@0.0.33
  - @fncts/transformers@0.0.7
  - @fncts/typelevel@0.0.16

## 0.0.39

### Patch Changes

- 66cdceb: refactor: make Either.match take an object
- c8c2908: perf: monomorphic ChannelPrimitive
- Updated dependencies [66cdceb]
- Updated dependencies [c8c2908]
  - @fncts/base@0.0.32

## 0.0.38

### Patch Changes

- 2841f39: fix: express route environment

## 0.0.37

### Patch Changes

- Updated dependencies [a680338]
  - @fncts/base@0.0.31

## 0.0.36

### Patch Changes

- 9db9163: feat: add Push operators
- dc06677: refactor: base Push on typed-fp

## 0.0.35

### Patch Changes

- e285588: feat: add IO.all and IO.allConcurrent
- e9aab4d: refactor: optimize conc methods
- 46e73ac: perf: monomorphic effect primitives
- Updated dependencies [e285588]
- Updated dependencies [3b33357]
- Updated dependencies [46e73ac]
  - @fncts/base@0.0.30

## 0.0.34

### Patch Changes

- 3811aff: chore: use vitest as test runner
- Updated dependencies [3811aff]
  - @fncts/transformers@0.0.6
  - @fncts/base@0.0.29
  - @fncts/typelevel@0.0.15

## 0.0.33

### Patch Changes

- c509183: feat(stream): add combinators
- e5ceaf2: feat: add Gen.anything
- 7e5877a: feat: make Either, Maybe, and Exit valid IOs
- Updated dependencies [c509183]
- Updated dependencies [e5ceaf2]
- Updated dependencies [7e5877a]
- Updated dependencies [1bee01b]
- Updated dependencies [1a28bfe]
  - @fncts/base@0.0.28

## 0.0.32

### Patch Changes

- 09bf7a1: chore: update dependencies
- fdf9ee4: chore: cleanup
- 99852d6: fix(io): tracing of thrown exceptions
- 1f1bd68: perf: speed up toQueueOfElements
- fdf9ee4: chore: cleanup
- 3a90ed8: chore: updates via ZIO
- Updated dependencies [09bf7a1]
- Updated dependencies [fdf9ee4]
- Updated dependencies [99852d6]
- Updated dependencies [02f20fe]
  - @fncts/transformers@0.0.5
  - @fncts/base@0.0.27
  - @fncts/typelevel@0.0.15

## 0.0.31

### Patch Changes

- abb301c: feat: add BackgroundScheduler
- e243270: feat: add non-transactional Semaphore
- f50edd8: fix(Semaphore): refactor based on @effect/io
- Updated dependencies [7893dfb]
- Updated dependencies [abb301c]
- Updated dependencies [c976656]
  - @fncts/base@0.0.26
  - @fncts/transformers@0.0.4
  - @fncts/typelevel@0.0.15

## 0.0.30

### Patch Changes

- 31e20f6: fix(IO): export provideScope

## 0.0.29

### Patch Changes

- 97d36b5: feat: add react package
- Updated dependencies [97d36b5]
  - @fncts/base@0.0.25
  - @fncts/transformers@0.0.4
  - @fncts/typelevel@0.0.15

## 0.0.28

### Patch Changes

- e9a03cd: chore(RefSubject): add unsafeGet extension

## 0.0.27

### Patch Changes

- 6928dcf: feat: add unsafeGet to RefSubject

## 0.0.26

### Patch Changes

- 729617c: feat: implement whenRef and whenFiberRef
- Updated dependencies [729617c]
  - @fncts/base@0.0.24

## 0.0.25

### Patch Changes

- 8dfac9a: fix: circular imports

## 0.0.24

### Patch Changes

- f01acb1: fix: FiberRef circular dependency

## 0.0.23

### Patch Changes

- 9d84807: refactor(Channel): execute acquire uninterruptibly
- b17a529: fix: DatumEither exports
- 8024090: refactor: optimize Future#await
- d268ec8: feat: implement MVar
- 7d755a2: chore: clean up type ids and variance symbols
- Updated dependencies [b17a529]
- Updated dependencies [7d755a2]
  - @fncts/base@0.0.23

## 0.0.22

### Patch Changes

- 30f12ca: refactor: make Eq, Ord, and Semigroup pipeable
- 690636b: refactor: standardize collections
- 14c84ad: refactor: re-add polymorphic Ref, Queue, and Hub
- 5b8927f: feat: implement FiberRuntime
- 4ac202c: refactor: rename combinators
- 276cb31: test: add Conc tests
- 029401e: feat: add push-based streams
- 3f04341: feat: add node stream module
- Updated dependencies [fe257b5]
- Updated dependencies [30f12ca]
- Updated dependencies [690636b]
- Updated dependencies [17b8af7]
- Updated dependencies [5b8927f]
- Updated dependencies [4ac202c]
- Updated dependencies [276cb31]
- Updated dependencies [029401e]
  - @fncts/base@0.0.22
  - @fncts/typelevel@0.0.15
  - @fncts/transformers@0.0.4

## 0.0.21

### Patch Changes

- e6ee7a5: refactor: simplify Ref, Queue, and Hub
- 02d4e7e: refactor: make everything pipeable
- Updated dependencies [e6ee7a5]
- Updated dependencies [02d4e7e]
  - @fncts/base@0.0.21
  - @fncts/transformers@0.0.3
  - @fncts/typelevel@0.0.14

## 0.0.20

### Patch Changes

- 30c999b: feat: add Differ
- Updated dependencies [30c999b]
  - @fncts/base@0.0.20

## 0.0.19

### Patch Changes

- d501ae1: fix: FiberRef join and forkScopeOverride (via ZIO)
- Updated dependencies [3274975]
  - @fncts/base@0.0.19

## 0.0.18

### Patch Changes

- 90ad430: chore: update tsplus
- fb9c8ed: refactor: simplify IO instructions
- Updated dependencies [90ad430]
  - @fncts/base@0.0.18
  - @fncts/transformers@0.0.2
  - @fncts/typelevel@0.0.14

## 0.0.17

### Patch Changes

- 9ed98be: feat: add tag transformer
- Updated dependencies [9ed98be]
  - @fncts/base@0.0.17
  - @fncts/transformers@0.0.1
  - @fncts/typelevel@0.0.13

## 0.0.16

### Patch Changes

- 618c5ce: refactor: require explicit id for Tag
- Updated dependencies [618c5ce]
  - @fncts/base@0.0.16

## 0.0.15

### Patch Changes

- 86d01b4: chore: update release
- Updated dependencies [86d01b4]
  - @fncts/base@0.0.15
  - @fncts/typelevel@0.0.12

## 0.0.14

### Patch Changes

- 572757e: feat(Stream): add chunksWith
- e71e991: refactor: add \_\_tsplusTrace to applicable functions
- b43d044: fix: incorrect \_\_tsplusTrace casing
- Updated dependencies [e71e991]
- Updated dependencies [594b38f]
  - @fncts/base@0.0.14
  - @fncts/typelevel@0.0.11

## 0.0.13

### Patch Changes

- d543dd6: refactor: covariant environment
- a0f8ed2: feat: IterableWeakMap and IterableWeakSet implement Map and Set
- ca3853b: refactor: use previous HKT encoding
- a74b350: chore: update dependencies
- Updated dependencies [d543dd6]
- Updated dependencies [a0f8ed2]
- Updated dependencies [15aaf26]
- Updated dependencies [ca3853b]
- Updated dependencies [73e1a58]
- Updated dependencies [bbe72f6]
  - @fncts/base@0.0.13
  - @fncts/typelevel@0.0.11

## 0.0.12

### Patch Changes

- bd50dfa: fix(build): add @babel/plugin-proposal-export-namespace-from to cjs config
- 14122f0: feat: add observable package
- Updated dependencies [bd50dfa]
  - @fncts/base@0.0.12
  - @fncts/typelevel@0.0.10

## 0.0.11

### Patch Changes

- 07dc52c: fix: Cause and Z circular dependency
- Updated dependencies [07dc52c]
  - @fncts/base@0.0.11
  - @fncts/typelevel@0.0.9

## 0.0.10

### Patch Changes

- 5d1eafa: chore: update dependencies
- 1ede0f0: feat: finish Sink api
- 8ea40ef: feat: implement TReentrantLock
- Updated dependencies [e6581bc]
- Updated dependencies [5d1eafa]
- Updated dependencies [5f1f22d]
- Updated dependencies [8ea40ef]
  - @fncts/base@0.0.10
  - @fncts/typelevel@0.0.8

## 0.0.9

### Patch Changes

- 1323211: feat: add express package
- b438746: chore: update tsplus
- Updated dependencies [b438746]
  - @fncts/base@0.0.9
  - @fncts/typelevel@0.0.7

## 0.0.8

### Patch Changes

- 4d77e94: feat: add `node` package
- Updated dependencies [4d77e94]
  - @fncts/base@0.0.8

## 0.0.7

### Patch Changes

- 286f472: fix: interruptibility of zipWithC (via ZIO)
- a2dde85: perf: improve performance of FiberRefs#join (via ZIO)
- eecc62c: feat(Cause): add Cause#squashWith
- Updated dependencies [eecc62c]
- Updated dependencies [56dd399]
- Updated dependencies [dd771bc]
  - @fncts/base@0.0.7

## 0.0.6

### Patch Changes

- da4343d: chore: update dependencies
- Updated dependencies [da4343d]
  - @fncts/base@0.0.6
  - @fncts/typelevel@0.0.6

## 0.0.5

### Patch Changes

- 8e7e087: chore: fix circular imports
- Updated dependencies [8e7e087]
  - @fncts/base@0.0.5
  - @fncts/typelevel@0.0.5

## 0.0.4

### Patch Changes

- 8a16019: bump version
- Updated dependencies [8a16019]
  - @fncts/base@0.0.4
  - @fncts/typelevel@0.0.4

## 0.0.3

### Patch Changes

- 2c6af71: rewrite ".js" to ".cjs" for commonjs build
- Updated dependencies [2c6af71]
  - @fncts/base@0.0.3
  - @fncts/typelevel@0.0.3

## 0.0.2

### Patch Changes

- d7320eb: include file extensions in output package.json export fields
- Updated dependencies [d7320eb]
  - @fncts/base@0.0.2
  - @fncts/typelevel@0.0.2
