# IO test gaps against ZIOSpec

This inventory compares `packages/io/test/io.test.ts` with the local
`.scratch/zio/core-tests/shared/src/test/scala/zio/ZIOSpec.scala`. Source line
numbers refer to that local snapshot. It is a test backlog, not a claim that an
API or behavior is missing: ZIO and fncts differ in names, types, runtime, and
platform. Check the implementation and the assertions before porting a case.
Other IO-package test files were not included in this comparison.

## Implementation notes

The portable additions live in `packages/io/test/io.test.ts`, alongside the
existing IO tests. The candidate list below is retained as the original
comparison, not a list of tests that are all still missing. The implementation
checks behavior rather than attempting to make all 496 ZIO titles match.

The added suites cover:

| fncts suites                                                                                                                           | ZIO behaviors adapted                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `or`, `catchJustCause`, `collectIO`, `filterOrElse`, `filterOrFail`, `ifIO`                                                            | Boolean short circuiting, selective cause recovery, collection of an effectful result, filtering, and branch selection                                                                                           |
| `ignore`, `isFailure`, `isSuccess`, `bimap`, `mapTryCatch`, `mapError`, `merge`                                                        | Error/value channel transformations and defect propagation                                                                                                                                                       |
| `maybe`, `get`, `unjust`, `getOrElse`, `getOrElseIO`, `require`, `getOrFailWith`, `fromMaybe`, `fromEither`, `fromExit`                | Optional values/errors, defaults, extraction, and supported constructors                                                                                                                                         |
| `orElse`, `orElseFail`, `orElseSucceed`, `orElseMaybe`, `reject`, `rejectIO`, `unrefineWith`, `refineOrHalt`, `resurrect`, `unsandbox` | Recovery, rejection, defect refinement, and cause round trips                                                                                                                                                    |
| `tapErrorCause`, `bitap`, `when`, `whenIO`, `summarized`, `zip`                                                                        | Observation, conditional execution, summaries, and sequential composition                                                                                                                                        |
| `sequenceIterable`, `allConcurrent`, `filter`, `filterNot`, `foldLeft`, `foldRight`, `foreach`, `foreachDiscard`                       | Ordering, referential transparency, failures, and sequential collection processing                                                                                                                               |
| `foreachConcurrent`, `foreachConcurrentDiscard`, bounded `foreachConcurrent`, `forkAll`                                                | Empty/single/many inputs, parallel progress, ordered results, accumulated failures, defects, interruption, cancellation, and concurrency limits                                                                  |
| `partition`, `mergeAll`, `firstSuccess`, `replicate`                                                                                   | Partitioning errors/values, merging, short circuiting, and repetition counts                                                                                                                                     |
| `iterate`, `loop`, `loopUnit`, `eventually`, predicate-based repeat/retry, `retry`, `schedule`                                         | Iteration, effectful predicates, at-least-once execution, stopping conditions, and scheduled recurrence                                                                                                          |
| `cached`, `cachedInvalidate`, `memoize`, `once`                                                                                        | Expiration, infinite TTL, invalidation, interruptible cache misses, issue 9015, interruption not being cached, and shared computation                                                                            |
| `acquireRelease`, `acquireReleaseExit`, `bracket`, `onExit`, `disconnect`                                                              | Scoped cleanup, exit-aware cleanup, acquisition/use/release failures, waiting for finalizers, and disconnected interruption                                                                                      |
| Runtime, supervision, and fiber regression suites                                                                                      | Laziness, stack safety, async registration/cancellation, interruption regions, inherited status, child supervision, racing, concurrent zips, FiberRefs, environment provision, timeouts, and JavaScript promises |

The equality-specific repeat/retry candidates are exercised through
predicate-based methods; fncts has no separate equality helpers. Bounded
parallel operations use `withConcurrency`. The defect-only recovery cases are
also covered by the existing `catchJustDefect` tests, including the unmatched
error and success channels. Existing asynchronous correctness and bracket
interruption tests remain in place.

Concurrency tests use `Future` handshakes to establish ordering, and
expiration/timeout tests use `TestClock` where advancing time is required. No
new tests rely on real-time sleeps.

Two regressions exposed by these tests were fixed in
`packages/io/src/IO/api.ts`:

- `replicate(n)` used an inclusive range ending at `n`, returning `n + 1`
  effects for nonnegative inputs. It now produces the requested number,
  including zero. The bounded traversal tests also check that the worker count
  respects its limit.
- `refineOrHaltWith` recovered only a single typed error and discarded the rest
  of a composite cause. It now transforms failures within the cause, preserving
  existing defects, cause structure, and traces.

### Candidates without a direct fncts port

These entries do not justify adding placeholder or skipped tests, or adding new
public APIs just for parity:

- JVM/Scala-specific behavior: fatal versus nonfatal exceptions, Scala
  `Future`/`Promise`/`Try`, execution contexts and executor shifting,
  auto-closeable resources, Scala overload resolution, covariance/`CanFail`
  checks, and function-arity/environment inference tests. JavaScript promise
  success, rejection, supplier exceptions, and async cancellation have their own
  tests instead.
- Convenience APIs not exposed by fncts: `&&`, `negate`, `collectFirst`,
  `exists`, `forall`, `flattenErrorOption`, collection `head`, extraction of
  `Either.left`/`Either.right`, `none`, `noneOrFail`, `noneOrFailWith`,
  exception-specific optional extraction, and a memoized-function constructor.
- Collection APIs not exposed by fncts: parallel filtering, parallel
  partitioning, parallel merging/reduction, `raceAll`, and the validation
  family. Sequential partitioning tests cover propagation of defects rather than
  introducing `collectAllSuccesses` helpers.
- Conditional/observation helpers not exposed by fncts: `unless*`, `whenCase*`,
  `tapDefect`, `tapSome`, `tapSomeError`, `onDone`, `onDoneCause`, and
  `updateService`. The available `when`/`whenIO`, `tapErrorCause`, `bitap`, and
  service access/provision APIs are tested directly.
- ZIO-only companion overloads, error-handler forking helpers, logging
  spans/annotations, and concrete runtime/executor types are not simulated with
  newly invented fncts APIs.
- Eager `Exit` operations already have dedicated coverage in
  `packages/base/test/data/exit.test.ts`, including `flatMap`, `map`, `bimap`,
  and `mapErrorCause`. fncts does not promise ZIO's exact eager-overload
  behavior for the remaining IO operations on an `Exit`.

Interruption ports check observable cleanup and causes rather than ZIO's exact
internal cause multiplicities. In particular, masked child effects record
observations before completion: leaving the mask can still make the child's
final exit interrupted in fncts, so joining it is not a substitute for
inspecting what happened inside the mask.

## How to read this list

Each bullet is a ZIO test for which an equivalent was not identified by matching
test names within the corresponding IO suite. This is a conservative **candidate
list**, not proof of absent coverage: renamed tests, combined assertions, and
tests in differently organized suites can cover the same behavior. Conversely,
equal names do not prove equal assertions. Cases involving Scala types, JVM
`Future`, auto-closeable resources, or ZIO-specific APIs may need adaptation or
may not apply. Source suite names are retained to make cases easy to find.

The comparison maps `acquireReleaseWith` to `bracket`, `catchSomeDefect` to
`catchJustDefect`, `foreachPar` to `foreachConcurrent`, and `zipPar` to
`zipConcurrent`; it also normalizes selected terminology (for example
`asyncZIO`/`asyncIO`, `flip`/`swap`, and `terminate`/`halt`). Matching is
limited to the mapped suite and test title, not implementation equivalence.

The snapshot contains 564 named ZIO test declarations; 68 have a corresponding
title under this rule, leaving 496 candidates below. These counts are
declarations, not necessarily executed test instances.

## Candidates by ZIO suite

### &&

- L29: true and true is true
- L32: true and false is false
- L35: false and true is false
- L38: false and false is false
- L41: short circuiting

### ||

- L46: true or true is true
- L49: true or false is true
- L52: false or true is true
- L55: false or false is false
- L58: short circuiting

### absorbWith

- L66: on die

### acquireReleaseWith

- L82: acquireRelease happy path
- L89: acquireReleaseExitWith happy path

### acquireReleaseWith + disconnect

- L113: acquireReleaseWith happy path
- L123: acquireRelease happy path

### cached

- L171: returns new instances after duration
- L185: correctly handles an infinite duration time to live

### cachedInvalidate

- L197: returns new instances after duration
- L218: get is interruptible
- L252: issue 9015
- L270: does not cache interruption

### catchNonFatalOrDie

- L279: recovers from NonFatal
- L286: dies if fatal

### catchAllDefect

- L295: recovers from all defects
- L302: leaves errors
- L309: leaves values

### catchSomeCause

- L318: catches matching cause
- L325: fails if cause doesn't match

### collectAllPar

- L386: returns the list in the same order
- L391: is referentially transparent
- L400: preserves failures

### collectAllParN

- L414: returns results in the same order

### collectAllParNDiscard

- L421: preserves failures

### collectAllSuccesses

- L427: propagates defects

### collectAllSuccessesPar

- L433: propagates defects

### collectFirst

- L439: collects the first value for which the effectual functions returns Some

### collectZIO

- L447: returns failure ignoring value

### companion object method consistency

- L467: absolve
- L476: firstSuccessOf
- L484: flatten
- L492: raceAll

### executor

- L502: retrieves the current executor for this effect

### repeatUntil

- L513: repeatUntil repeats until condition is true
- L521: repeatUntil always evaluates effect at least once

### repeatUntilEquals

- L530: repeatUntilEquals repeats until result is equal to predicate

### repeatUntilZIO

- L541: repeatUntilZIO repeat until effectful condition is true
- L549: repeatUntilZIO always evaluates effect at least once

### repeatWhile

- L558: repeatWhile repeats while condition is true
- L566: repeatWhile always evaluates effect at least once

### repeatWhileEquals

- L575: repeatWhileEquals repeats while result equals predicate

### repeatWhileZIO

- L586: repeatWhileZIO repeats while condition is true
- L594: repeatWhileZIO always evaluates effect at least once

### eventually

- L603: succeeds eventually

### exists

- L616: determines whether any element satisfies the effectual predicate

### filter

- L625: filters a collection using an effectual predicate
- L634: filters a set using an effectual predicate

### filterNot

- L645: filters a collection using an effectual predicate
- L654: filters a set using an effectual predicate

### filterPar

- L665: filters a collection in parallel using an effectual predicate

### filterNotPar

- L673: filters a collection in parallel using an effectual predicate, removing
  all elements that satisfy the predicate

### filterOrElseWith

- L683: returns checked failure from held value

### filterOrElse

- L697: returns checked failure ignoring value

### filterOrFail

- L711: returns failure ignoring value

### flattenErrorOption

- L725: fails when given Some error
- L729: fails with Default when given None error
- L733: succeeds when given a value

### foldLeft

- L739: with a successful step function sums the list properly
- L745: `with a failing step function returns a failed IO
- L751: run sequentially from left to right

### foldRight

- L759: with a successful step function sums the list properly
- L765: `with a failing step function returns a failed IO
- L771: run sequentially from right to left

### forall

- L779: determines whether all elements satisfy the effectual predicate

### foreach

- L788: returns the list of results
- L794: returns the list of results with async nodes
- L800: both evaluates effects and returns the list of results in the same order
- L808: fails if one of the effects fails

### foreachDiscard

- L815: runs effects in order
- L823: can be run twice

### foreach for Option

- L835: succeeds with None given None
- L839: succeeds with Some given Some
- L844: fails if the optional effect fails

### foreachPar

- L851: runs single task
- L856: runs two tasks
- L861: runs many tasks
- L866: runs a task that fails
- L876: runs two failed tasks
- L887: runs a task that dies
- L897: runs a task that is interrupted
- L907: runs a task that throws an unsuspended exception
- L918: returns results in the same order for Chunk
- L930: runs effects in parallel for Chunk
- L942: interrupts effects on first failure

### foreachParDiscard

- L966: accumulates errors
- L981: runs all effects
- L990: runs all effects for Chunk
- L999: completes on empty input

### foreachParN

- L1004: returns the list of results in the appropriate order
- L1009: works on large lists
- L1015: runs effects in parallel
- L1023: propagates error
- L1028: interrupts effects on first failure

### foreachParNDiscard

- L1039: runs all effects

### forkAll

- L1050: returns the list of results in the same order
- L1055: happy-path
- L1059: empty input
- L1062: propagate failures
- L1070: propagates defects
- L1087: infers correctly
- L1097: infers correctly with error type

### forkWithErrorHandler

- L1109: calls provided function when task fails

### from

- L1118: Attempt
- L1126: Either
- L1135: EitherCause
- L1144: EitherCauseLeft
- L1153: EitherCauseRight
- L1162: EitherLeft
- L1171: EitherRight
- L1180: Fiber
- L1189: FiberRuntime
- L1198: FiberSynthetic
- L1207: FiberZIO
- L1219: FiberZIORuntime
- L1231: FiberZIOSynthetic
- L1243: Future
- L1252: FutureExecutionContext
- L1261: Option
- L1269: OptionNone
- L1276: OptionSome
- L1284: PromiseScala
- L1293: Try
- L1301: TryFailure
- L1309: TrySuccess

### fromEither

- L1319: produces a stack trace on failure

### fromEitherCause

- L1327: produces a stack trace on failure

### fromFutureInterrupt

- L1335: running Future can be interrupted
- L1349: interruption blocks on interruption of the Future

### head

- L1360: on non empty list
- L1363: on empty list
- L1366: on failure

### ifZIO

- L1371: runs `onTrue` if result of `b` is `true`
- L1375: runs `onFalse` if result of `b` is `false`
- L1379: infers correctly

### ignore

- L1393: return success as Unit
- L1396: return failure as Unit
- L1399: not catch throwable
- L4809: ignores successes
- L4816: ignores failures

### isFailure

- L1404: returns true when the effect is a failure
- L1407: returns false when the effect is a success

### isSuccess

- L1412: returns false when the effect is a failure
- L1415: returns true when the effect is a success

### iterate

- L1420: iterates with the specified effectual function

### left

- L1427: on Left value
- L1430: on Right value
- L1433: on failure

### onExecutor

- L1438: effects continue on current executor if no executor is specified
- L1452: effects are shifted back if executor is specified
- L1462: effects are shifted back at next yield

### loop

- L1473: loops with the specified effectual function
- L1480: collects the results into a list

### loopDiscard

- L1487: loops with the specified effectual function

### mapBoth

- L1496: maps over both error and value channels

### mapEffect

- L1504: returns an effect whose success is mapped by the specified side
  effecting function
- L1508: translates any thrown exceptions into typed failed effects

### mapError

- L1514: preserves the cause

### memoize

- L1531: non-memoized returns new instances on repeated calls
- L1536: memoized returns the same instance on repeated calls
- L1542: memoized function returns the same instance on repeated calls

### merge

- L1555: on flipped result

### mergeAll

- L1565: return zero element on empty input
- L1572: merge list using function
- L1578: return error if it exists in list

### mergeAllPar

- L1585: return zero element on empty input
- L1592: merge list using function
- L1598: return error if it exists in list

### none

- L1605: on Some fails with None
- L1609: on None succeeds with ()
- L1613: fails with Some(ex) when effect fails with ex

### fork

- L1620: propagates interruption
- L1623: propagates interruption with zip of defect
- L1631: child fibers can be created on interrupted parents within
  unininterruptible regions

### negate

- L1651: on true returns false
- L1654: on false returns true

### noneOrFail

- L1659: on None succeeds with Unit
- L1667: on Some fails

### noneOrFailWith

- L1676: on None succeeds with Unit
- L1685: on Some fails

### once

- L1694: returns an effect that will only be executed once

### onExit

- L1704: executes that a cleanup function runs when effect succeeds
- L1714: ensures that a cleanup function runs when an effect fails
- L1728: ensures that a cleanup function runs when an effect is interrupted

### option

- L1743: return success in Some
- L1747: return failure as None
- L1750: not catch throwable
- L1754: catch throwable after sandboxing

### unsome

- L1759: fails when given Some error
- L1763: succeeds with None given None error
- L1767: succeeds with Some given a value

### orElse

- L1773: does not recover from defects
- L1787: left failed and right died with kept cause
- L1796: left failed and right failed with kept cause
- L1805: is associative

### orElseFail

- L1821: executes this effect and returns its value if it succeeds
- L1825: otherwise fails with the specified error

### orElseOptional

- L1830: produces the value of this effect if it succeeds
- L1834: produces the value of this effect if it fails with some error
- L1838: produces the value of the specified effect if it fails with none

### orElseSucceed

- L1844: executes this effect and returns its value if it succeeds
- L1848: otherwise succeeds with the specified value

### parallelErrors

- L1853: oneFailure
- L1860: allFailures

### partition

- L1873: collects only successes
- L1880: collects only failures
- L1886: collects failures and successes
- L1892: evaluates effects in correct order

### partitionPar

- L1903: collects a lot of successes
- L1910: collects failures
- L1916: collects failures and successes

### partitionParN

- L1924: collects a lot of successes
- L1931: collects failures
- L1937: collects failures and successes
- L1944: provideSomeLayer

### raceAll

- L1958: returns first success
- L1961: returns last failure
- L1964: returns success when it happens after failure
- L1967: always calls finalizers

### reduceAllPar

- L1979: return zero element on empty input
- L1986: reduce list using function
- L1993: return error if zero is an error
- L1999: return error if it exists in list

### replicate

- L2007: zero
- L2011: negative
- L2015: positive

### retryN

- L2021: retryN retries n times

### retryUntil

- L2030: retryUntil retries until condition is true
- L2038: retryUntil runs at least once

### retryUntilEquals

- L2047: retryUntilEquals retries until error equals predicate

### retryUntilZIO

- L2058: retryUntilZIO retries until condition is true
- L2066: retryUntilZIO runs at least once

### retryWhile

- L2075: retryWhile retries while condition is true
- L2083: retryWhile runs at least once

### retryWhileEquals

- L2092: retryWhileEquals retries while error equals predicate

### retryWhileZIO

- L2103: retryWhileZIO retries while condition is true
- L2111: retryWhileZIO runs at least once

### right

- L2120: on Right value
- L2123: on Left value
- L2126: on failure

### refineToOrDie

- L2131: does not compile when refined type is not subtype of error type
- L2143: preserves the cause

### some

- L2160: extracts the value from Some
- L2164: make a task from a defined option
- L2167: make a task from an empty option
- L2170: fails on None
- L2174: fails when given an exception

### someOrFailException

- L2181: extracts the optional value
- L2184: fails when given a None

### someOrFailException / without another error type

- L2189: succeed something
- L2192: succeed nothing

### someOrFailException / with throwable as base error type

- L2197: return something

### someOrFailException / with exception as base error type

- L2202: return something

### reject

- L2208: returns failure ignoring value

### rejectZIO

- L2220: Check `rejectZIO` returns failure ignoring value

### RTS synchronous correctness

- L2239: fast-path resumption
- L2244: widen Nothing
- L2250: succeed must be lazy
- L2261: suspend must be lazy
- L2272: suspendSucceed must not catch throwable
- L2276: suspend must catch throwable
- L2280: suspendSucceed must be evaluatable
- L2283: ZIO.suspendSucceed is implemented with a ZIO.unit as first
- L2322: sync effect

### Timeout don't lose all values from parent fiber

- L2366: When effect is winner and failed
- L2378: When effect is loser

### RTS failure

- L2395: attempt . fail
- L2403: deep attempt sync effect error
- L2406: deep attempt fail error
- L2409: attempt . sandbox . terminate
- L2413: fold . sandbox . terminate
- L2417: catch sandbox terminate
- L2421: uncaught fail
- L2424: uncaught sync effect error
- L2428: deep uncaught sync effect error
- L2478: timeout a long computation with an error
- L2482: timeout a long computation with a cause
- L2492: timeout in uninterruptible region
- L2515: timeout does not allow interruption to be observed in uninterruptible
  region
- L2525: catchAllCause
- L2534: exception in fromFuture does not kill fiber

### RTS finalizers

- L2550: fail on error
- L2588: acquireReleaseWith exit is usage result
- L2592: error in just acquisition
- L2596: error in just release
- L2600: error in just usage
- L2604: rethrown caught error in acquisition
- L2608: rethrown caught error in release
- L2612: rethrown caught error in usage
- L2616: test eval of async fail
- L2627: acquireReleaseWith regression 1
- L2650: interrupt waits for finalizer

### RTS synchronous stack safety

- L2668: deep map of now
- L2671: deep map of sync effect
- L2674: deep attempt
- L2678: deep flatMap
- L2693: deep absolve/attempt is identity
- L2699: deep async absolve/attempt is identity

### RTS asynchronous correctness

- L2716: deep asyncZIO doesn't block threads
- L2748: fatal errors in registering async callback are captured
- L2755: resumption takes precedence over fatal error in registering callback
- L2794: test interruption of infinite async in uninterruptible region

### interruption semantics

- L2838: self-interruption triggers onInterrupt
- L2846: self-interruption can be averted
- L2854: interrupters are accretive
- L2872: child interrupted cause cannot be seen from parent
- L2881: interruption cannot be be seen from within the region it originates 1
- L2891: interruption cannot be be seen from within the region it originates 2
- L2902: interrupters can be seen even in uninterruptible regions
- L2912: interruption cannot be caught in interruptible regions
- L2921: interruption cannot be caught at the end of uninterruptible regions
- L2933: interruption can be caught at the beginning of uninterruptible regions
- L2945: previous typed errors are discarded after interruptible region
- L2962: previous untyped errors are retained even after interruptible region

### RTS concurrency correctness

- L2991: asyncZIO creation is interruptible
- L3031: auto-interruption in fork of race
- L3097: race always calls finalizers
- L3107: firstSuccessOf of values
- L3111: firstSuccessOf of failures
- L3115: firstSuccessOF of failures & 1 success
- L3141: raceFirst interrupts losers on success
- L3152: raceFirst interrupts losers on failure
- L3163: raceFirst always calls finalizers
- L3183: mergeAllEmpty
- L3187: reduceAll
- L3191: reduceAll Empty List
- L3195: timeout of failure
- L3199: timeout of terminate

### RTS option tests

- L3205: lifting a value to an option
- L3208: using the none value

### RTS either helper tests

- L3213: lifting a value into right
- L3216: lifting a value into left

### RTS interruption

- L3221: zipPar is interruptible
- L3341: acquireReleaseExitWith disconnect acquire returns immediately on
  interrupt
- L3357: acquireReleaseWith disconnect use is interruptible
- L3363: acquireReleaseExitWith disconnect use is interruptible
- L3370: acquireReleaseWith disconnect release called on interrupt in separate
  fiber
- L3385: acquireReleaseExitWith disconnect release called on interrupt in
  separate fiber
- L3400: catchAll + ensuring + interrupt
- L3411: finalizer can detect interruption
- L3423: interrupted cause persists after catching
- L3440: interruption of raced
- L3457: recovery of error in finalizer
- L3471: recovery of interruptible
- L3487: sandbox of ordinary failure
- L3492: sandbox of ordinary failure - fork/join
- L3498: sandbox of interruptible
- L3512: run of interruptible
- L3525: alternating interruptibility
- L3537: interruption after defect
- L3549: interruption after defect 2
- L3561: disconnect returns immediately on interrupt
- L3572: disconnected effect that is then interrupted eventually performs
  interruption
- L3587: disconnect does not allow interruption to be observed in
  uninterruptible regions
- L3599: cause reflects interruption
- L3605: acquireRelease use inherits interrupt status
- L3621: acquireRelease use inherits interrupt status 2
- L3639: async can be uninterruptible
- L3649: closing scope is uninterruptible
- L3661: asyncInterrupt cancelation
- L3676: interruption is not inherited on fork
- L3688: interruption is propagated to grandchild in race in uninterruptible
  region
- L3700: child can outlive parent in race

### RTS environment

- L3714: provide is modular
- L3724: async can use environment

### RTS forking inheritability

- L3730: interruption status is heritable
- L3738: executor is heritable

### serviceWith

- L3751: effectfully accesses a service in the environment

### fromFunction

- L3757: 1 arg
- L3763: 2 arg
- L3769: 3 arg
- L3775: 4 arg
- L3781: 5 arg
- L3793: 6 arg
- L3806: 7 arg

### fromFunctionZIO

- L3822: 1 arg
- L3828: fromFunction works with environment
- L3840: 2 arg
- L3846: 3 arg
- L3856: 4 arg
- L3867: 5 arg
- L3879: 6 arg
- L3892: 7 arg

### schedule

- L3919: runs effect for each recurrence of the schedule

### someOrElse

- L3931: extracts the value from Some
- L3934: falls back to the default value if None
- L3937: works when the default is an instance of a covariant type constructor
  applied to Nothing
- L3940: does not change failed state

### someOrElseZIO

- L3945: extracts the value from Some
- L3948: falls back to the default effect if None
- L3951: works when the output of the default is an instance of a covariant type
  constructor applied to Nothing
- L3954: does not change failed state

### someOrFail

- L3959: extracts the optional value
- L3963: fails when given a None

### summarized

- L3969: returns summary and value

### tapErrorCause

- L3983: effectually peeks at the cause of the failure of this effect

### tapDefect

- L3993: effectually peeks at defects
- L4001: leaves failures

### tapEither

- L4011: effectually peeks at the failure of this effect
- L4024: effectually peeks at the success of this effect

### tapSome

- L4039: is identity if the function doesn't match
- L4047: runs the effect if the function matches

### tapSomeError

- L4057: is identity if the function doesn't match
- L4064: runs the effect if the function matches

### timeout disconnect

- L4073: returns `Some` with the produced value if the effect completes before
  the timeout elapses
- L4076: returns `None` otherwise

### transplant

- L4085: preserves supervision relationship of nested fibers
- L4104: unleft

### unless

- L4113: executes correct branch only

### unlessDiscard

- L4131: executes correct branch only

### unlessZIO

- L4149: executes condition effect and correct branch
- L4172: infers correctly

### unlessZIODiscard

- L4185: executes condition effect and correct branch
- L4208: infers correctly

### unrefine

- L4221: converts some fiber failures into errors
- L4227: leaves the rest

### unrefineTo

- L4235: converts some fiber failures into errors
- L4241: leaves the rest

### unrefineWith

- L4249: converts some fiber failures into errors
- L4255: leaves the rest
- L4261: uses the specified function to convert the `E` into an `E1`
- L4267: right

### unsandbox

- L4276: unwraps exception
- L4284: no information is lost during composition

### updateService

- L4296: updates a service in the environment

### validate

- L4305: returns all errors if never valid
- L4311: accumulate errors and ignore successes
- L4317: accumulate successes

### validateDiscard

- L4325: returns all errors if never valid

### validatePar

- L4333: returns all errors if never valid
- L4339: accumulate errors and ignore successes
- L4345: accumulate successes

### validateParDiscard

- L4352: returns all errors if never valid

### validateFirst

- L4359: returns all errors if never valid
- L4364: runs sequentially and short circuits on first success validation
- L4375: returns errors in correct order

### validateFirstPar

- L4383: returns all errors if never valid
- L4388: returns success if valid

### validateWith

- L4397: succeeds
- L4400: fails
- L4403: combines both cause

### onDone and onDoneCause

- L4410: onDone - should execute success callback synchronously on success
- L4419: onDone - should execute error callback synchronously on failure
- L4430: onDoneCause - should execute success callback synchronously on success
- L4439: onDoneCause - should execute error callback synchronously on failure
  with cause

### when

- L4452: executes correct branch only

### whenDiscard

- L4470: executes correct branch only

### whenCase

- L4488: executes correct branch only

### whenCaseDiscard

- L4501: executes correct branch only

### whenCaseZIODiscard

- L4522: executes condition effect and correct branch

### whenCaseZIO

- L4535: executes condition effect and correct branch

### whenZIO

- L4548: executes condition effect and correct branch
- L4571: infers correctly

### whenZIODiscard

- L4584: executes condition effect and correct branch
- L4607: infers correctly
- L4619: zip is compositional

### zipPar

- L4630: does not swallow exit causes of loser
- L4636: does not report failure when interrupting loser after it succeeded
- L4641: passes regression 1
- L4646: paralellizes simple success values
- L4654: does not kill fiber when forked on parent scope
- L4674: preserves failures
- L4698: propagates interruption
- L4702: propagates FiberRef values

### toFuture

- L4714: should fail with StackTrace attached

### resurrect

- L4722: should fail checked

### options

- L4729: basic option test
- L4736: side effect unit in option test

### promises

- L4745: promise test
- L4760: promise supplier test
- L4775: promise ugly path test
- L4793: fail captures the spans
- L4798: fail captures the annotations
- L4803: orDie preserves the cause

### fromAutoCloseable

- L4825: Runs finalizers properly

### eager evaluation of ZIO methods on Exit

- L4840: as
- L4844: flatMap(success)
- L4848: flatMap(failure)
- L4852: fold(success)
- L4856: fold(failure)
- L4860: foldCause(success)
- L4864: foldCause(failure)
- L4868: map
- L4872: mapBoth(success)
- L4876: mapBoth(failure)
- L4880: mapErrorCause(success)
- L4884: mapErrorCause(failure)
- L4888: unit

## Title-matched cases excluded from the candidate list

These still need assertion-level verification; the IO line is given to make that
review straightforward.

- `heap` — unit.forever is safe: ZIO L20, IO L9
- `absorbWith` — on fail: ZIO L63, IO L21
- `absorbWith` — on success: ZIO L69, IO L33
- `acquireReleaseWith` — acquireReleaseWith happy path: ZIO L74, IO L41
- `acquireReleaseWith` — acquireReleaseExitWith error handling: ZIO L99, IO L57
- `acquireReleaseWith + disconnect` — acquireReleaseExitWith happy path: ZIO
  L130, IO L83
- `acquireReleaseWith + disconnect` — acquireReleaseExitWith error handling: ZIO
  L142, IO L99
- `acquireReleaseWith + disconnect` — acquireReleaseExitWith beast mode error
  handling: ZIO L155, IO L123
- `catchSomeDefect` — recovers from some defects: ZIO L336, IO L150
- `catchSomeDefect` — leaves the rest: ZIO L345, IO L158
- `catchSomeDefect` — leaves errors: ZIO L354, IO L166
- `catchSomeDefect` — leaves values: ZIO L363, IO L172
- `collect` — returns failure ignoring value: ZIO L374, IO L180
- `foreachPar` — returns results in the same order: ZIO L913, IO L228
- `foreachPar` — runs effects in parallel: ZIO L923, IO L237
- `foreachPar` — propagates error: ZIO L937, IO L248
- `foreachPar` — does not kill fiber when forked on the parent scope: ZIO L956,
  IO L271
- `RTS synchronous correctness` — point, bind, map: ZIO L2289, IO L813
- `RTS synchronous correctness` — effect, bind, map: ZIO L2300, IO L828
- `RTS synchronous correctness` — effect, bind, map, redeem: ZIO L2311, IO L843
- `RTS synchronous correctness` — deep effects: ZIO L2329, IO L861
- `RTS synchronous correctness` — flip must make error into value: ZIO L2352, IO
  L886
- `RTS synchronous correctness` — flip must make value into error: ZIO L2356, IO
  L892
- `RTS synchronous correctness` — flipping twice returns identical value: ZIO
  L2360, IO L897
- `RTS failure` — error in sync effect: ZIO L2391, IO L904
- `RTS failure` — catch failing finalizers with fail: ZIO L2431, IO L915
- `RTS failure` — catch failing finalizers with terminate: ZIO L2445, IO L939
- `RTS failure` — run preserves interruption status: ZIO L2459, IO L963
- `RTS failure` — run swallows inner interruption: ZIO L2467, IO L974
- `RTS failure` — timeout a long computation: ZIO L2474, IO L984
- `RTS failure` — timeout repetition of uninterruptible effect: ZIO L2487, IO
  L989
- `RTS failure` — timeout preserves uninterruptibility: ZIO L2496, IO L994
- `RTS finalizers` — fail ensuring: ZIO L2540, IO L284
- `RTS finalizers` — finalizer errors not caught: ZIO L2563, IO L300
- `RTS finalizers` — finalizer errors reported: ZIO L2574, IO L311
- `RTS asynchronous correctness` — simple async must return: ZIO L2708, IO L332
- `RTS asynchronous correctness` — simple asyncZIO must return: ZIO L2712, IO
  L336
- `RTS asynchronous correctness` — interrupt of asyncZIO register: ZIO L2732, IO
  L353
- `RTS asynchronous correctness` — async should not resume fiber twice after
  interruption: ZIO L2762, IO L373
- `RTS asynchronous correctness` — sleep 0 must return: ZIO L2811, IO L420
- `RTS asynchronous correctness` — shallow bind of async chain: ZIO L2814, IO
  L421
- `RTS asynchronous correctness` — asyncZIO can fail before registering: ZIO
  L2821, IO L427
- `RTS asynchronous correctness` — asyncZIO can defect before registering: ZIO
  L2828, IO L431
- `RTS concurrency correctness` — shallow fork/join identity: ZIO L2981, IO L446
- `RTS concurrency correctness` — deep fork/join identity: ZIO L2987, IO L454
- `RTS concurrency correctness` — asyncInterrupt runs cancel token on interrupt:
  ZIO L3005, IO L458
- `RTS concurrency correctness` — daemon fiber is unsupervised: ZIO L3021, IO
  L475
- `RTS concurrency correctness` — race in daemon is executed: ZIO L3050, IO L487
- `RTS concurrency correctness` — supervise fibers: ZIO L3066, IO L513
- `RTS concurrency correctness` — race of fail with success: ZIO L3081, IO L528
- `RTS concurrency correctness` — race of terminate with success: ZIO L3085, IO
  L532
- `RTS concurrency correctness` — race of fail with fail: ZIO L3089, IO L536
- `RTS concurrency correctness` — race of value & never: ZIO L3093, IO L540
- `RTS concurrency correctness` — raceFirst interrupts loser on success: ZIO
  L3119, IO L580
- `RTS concurrency correctness` — raceFirst interrupts loser on failure: ZIO
  L3130, IO L596
- `RTS concurrency correctness` — mergeAll: ZIO L3178, IO L612
- `RTS interruption` — sync forever is interruptible: ZIO L3233, IO L618
- `RTS interruption` — interrupt of never is interrupted with cause: ZIO L3241,
  IO L624
- `RTS interruption` — asyncZIO is interruptible: ZIO L3247, IO L627
- `RTS interruption` — async is interruptible: ZIO L3256, IO L633
- `RTS interruption` — acquireReleaseWith is uninterruptible: ZIO L3265, IO L641
- `RTS interruption` — acquireReleaseExitWith is uninterruptible: ZIO L3275, IO
  L655
- `RTS interruption` — acquireReleaseWith use is interruptible: ZIO L3290, IO
  L669
- `RTS interruption` — acquireReleaseExitWith use is interruptible: ZIO L3296,
  IO L683
- `RTS interruption` — acquireReleaseWith release called on interrupt: ZIO
  L3302, IO L697
- `RTS interruption` — acquireReleaseExitWith release called on interrupt: ZIO
  L3316, IO L714
- `RTS interruption` — acquireReleaseWith acquire returns immediately on
  interrupt: ZIO L3330, IO L733
- `zipPar` — is interruptible: ZIO L4686, IO L754
