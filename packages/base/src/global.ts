/**
 * @tsplus global
 */
import type {} from "@fncts/base";

/**
 * @tsplus global
 */
import {} from "@fncts/base/collection/compat/Array";
/**
 * @tsplus global
 */
import { Conc, ConcBuilder } from "@fncts/base/collection/immutable/Conc";
/**
 * @tsplus global
 */
import { Dictionary } from "@fncts/base/collection/immutable/Dictionary/definition";
/**
 * @tsplus global
 */
import { HashMap } from "@fncts/base/collection/immutable/HashMap/definition";
/**
 * @tsplus global
 */
import { HashSet } from "@fncts/base/collection/immutable/HashSet/definition";
/**
 * @tsplus global
 */
import { ImmutableArray } from "@fncts/base/collection/immutable/ImmutableArray/definition";
/**
 * @tsplus global
 */
import {
  ImmutableNonEmptyArray,
  NonEmptyArray,
  ReadonlyNonEmptyArray,
} from "@fncts/base/collection/immutable/ImmutableNonEmptyArray/definition";
/**
 * @tsplus global
 */
import { Cons, List, Nil } from "@fncts/base/collection/immutable/List/definition";
/**
 * @tsplus global
 */
import { Queue as ImmutableQueue } from "@fncts/base/collection/immutable/Queue/definition";
/**
 * @tsplus global
 */
import { RoseTree } from "@fncts/base/collection/immutable/RoseTree";
/**
 * @tsplus global
 */
import { SortedMap } from "@fncts/base/collection/immutable/SortedMap/definition";
/**
 * @tsplus global
 */
import { Vector } from "@fncts/base/collection/immutable/Vector";
/**
 * @tsplus global
 */
import { Iterable } from "@fncts/base/collection/Iterable/definition";
/**
 * @tsplus global
 */
import { HashMap as MutableHashMap } from "@fncts/base/collection/mutable/HashMap";
/**
 * @tsplus global
 */
import { HashSet as MutableHashSet } from "@fncts/base/collection/mutable/HashSet";
/**
 * @tsplus global
 */
import { ListBuffer } from "@fncts/base/collection/mutable/ListBuffer";
/**
 * @tsplus global
 */
import { Eval } from "@fncts/base/control/Eval/definition";
/**
 * @tsplus global
 */
import { LazyValue } from "@fncts/base/control/LazyValue";
/**
 * @tsplus global
 */
import { Z } from "@fncts/base/control/Z/definition";
/**
 * @tsplus global
 */
import { Byte } from "@fncts/base/data/Byte";
/**
 * @tsplus global
 */
import { CaseClass } from "@fncts/base/data/CaseClass";
/**
 * @tsplus global
 */
import { Cause } from "@fncts/base/data/Cause/definition";
/**
 * @tsplus global
 */
import { Const } from "@fncts/base/data/Const/definition";
/**
 * @tsplus global
 */
import { Datum } from "@fncts/base/data/Datum/definition";
/**
 * @tsplus global
 */
import { DatumEither } from "@fncts/base/data/DatumEither/definition";
/**
 * @tsplus global
 */
import { Decoder } from "@fncts/base/data/Decoder/definition";
/**
 * @tsplus global
 */
import { Duration } from "@fncts/base/data/Duration/definition";
/**
 * @tsplus global
 */
import { Either } from "@fncts/base/data/Either/definition";
/**
 * @tsplus global
 */
import { Encoder } from "@fncts/base/data/Encoder/definition";
/**
 * @tsplus global
 */
import { Environment } from "@fncts/base/data/Environment/definition";
/**
 * @tsplus global
 */
import { EnvironmentPatch } from "@fncts/base/data/EnvironmentPatch";
/**
 * @tsplus global
 */
import { Eq } from "@fncts/base/data/Eq/definition";
/**
 * @tsplus global
 */
import { Equatable } from "@fncts/base/data/Equatable";
/**
 * @tsplus global
 */
import {
  ArrayIndexOutOfBoundsError,
  IllegalArgumentError,
  IllegalStateError,
  IndexOutOfBoundsError,
  InterruptedException,
  InvalidCapacityError,
  isInterruptedException,
  isInvalidCapacityError,
  NoSuchElementError,
} from "@fncts/base/data/exceptions";
/**
 * @tsplus global
 */
import { ExecutionStrategy } from "@fncts/base/data/ExecutionStrategy";
/**
 * @tsplus global
 */
import { Exit } from "@fncts/base/data/Exit/definition";
/**
 * @tsplus global
 */
import { FiberId } from "@fncts/base/data/FiberId/definition";
/**
 * @tsplus global
 */
import { unsafeCoerce } from "@fncts/base/data/function/api";
/**
 * @tsplus global
 */
import { Lazy } from "@fncts/base/data/function/definition";
/**
 * @tsplus global
 */
import { Guard } from "@fncts/base/data/Guard";
/**
 * @tsplus global
 */
import { Hashable } from "@fncts/base/data/Hashable";
/**
 * @tsplus global
 */
import { Identity } from "@fncts/base/data/Identity/definition";
/**
 * @tsplus global
 */
import { Interval } from "@fncts/base/data/Interval";
/**
 * @tsplus global
 */
import { Intervals } from "@fncts/base/data/Intervals";
/**
 * @tsplus global
 */
import { Just, Maybe, MaybeTag, Nothing } from "@fncts/base/data/Maybe/definition";
/**
 * @tsplus global
 */
import { Newtype, NewtypeIso } from "@fncts/base/data/Newtype";
/**
 * @tsplus global
 */
import {} from "@fncts/base/data/number/definition";
import {} from "@fncts/base/data/object/definition";
/**
 * @tsplus global
 */
import {} from "@fncts/base/data/object/definition";
/**
 * @tsplus global
 */
import { Ord } from "@fncts/base/data/Ord/definition";
/**
 * @tsplus global
 */
import { Ordering } from "@fncts/base/data/Ordering";
/**
 * @tsplus global
 */
import { Predicate, PredicateWithIndex } from "@fncts/base/data/Predicate/definition";
/**
 * @tsplus global
 */
import { Refinement, RefinementWithIndex } from "@fncts/base/data/Refinement/definition";
/**
 * @tsplus global
 */
import {} from "@fncts/base/data/string/definition";
/**
 * @tsplus global
 */
import { Struct } from "@fncts/base/data/Struct/definition";
/**
 * @tsplus global
 */
import { Tag } from "@fncts/base/data/Tag/definition";
/**
 * @tsplus global
 */
import { These } from "@fncts/base/data/These";
/**
 * @tsplus global
 */
import { Trace } from "@fncts/base/data/Trace/definition";
/**
 * @tsplus global
 */
import { TraceElement } from "@fncts/base/data/TraceElement/definition";
/**
 * @tsplus global
 */
import { Zipped } from "@fncts/base/data/Zipped";
/**
 * @tsplus global
 */
import { Stack } from "@fncts/base/internal/Stack";
/**
 * @tsplus global
 */
import { Has } from "@fncts/base/typeclass/Has";
/**
 * @tsplus global
 */
import { hasTypeId, isByte, isObject } from "@fncts/base/util/predicates";
/**
 * @tsplus global
 */
import { HKT } from "@fncts/typelevel/HKT";
