import type { Conc } from "@fncts/base/collection/immutable/Conc";
import type { RuntimeFiber } from "@fncts/base/control/Fiber";
import type { Ref } from "@fncts/base/control/Ref";

import { HashSet } from "@fncts/base/collection/immutable/HashSet";
import { Either } from "@fncts/base/data/Either";
import { Tag } from "@fncts/base/data/Tag";

import { TestAnnotation } from "./definition.js";

export const IgnoredTag = Tag<number>();
/**
 * @tsplus static fncts.data.TestAnnotationOps Ignored
 */
export const Ignored = new TestAnnotation(IgnoredTag, "ignored", 0, (x, y) => x + y);

export const RepeatedTag = Tag<number>();
/**
 * @tsplus static fncts.data.TestAnnotationOps Repeated
 */
export const Repeated = new TestAnnotation(RepeatedTag, "repeated", 0, (x, y) => x + y);

export const RetriedTag = Tag<number>();
/**
 * @tsplus static fncts.data.TestAnnotationOps Retried
 */
export const Retried = new TestAnnotation(RetriedTag, "retried", 0, (x, y) => x + y);

export const TaggedTag = Tag<HashSet<string>>();
/**
 * @tsplus static fncts.data.TestAnnotationOps Tagged
 */
export const Tagged = new TestAnnotation(TaggedTag, "tagged", HashSet.makeDefault(), (x, y) =>
  x.union(y),
);

export const TimingTag = Tag<number>();
/**
 * @tsplus static fncts.data.TestAnnotationOps Timing
 */
export const Timing = new TestAnnotation(TimingTag, "timing", 0, (x, y) => x + y);

export const FibersTag = Tag<Either<number, Conc<Ref<HashSet<RuntimeFiber<any, any>>>>>>();
/*
 * @tsplus static fncts.data.TestAnnotationOps Fibers
 */
export const Fibers = new TestAnnotation(FibersTag, "fibers", Either.left(0), (left, right) => {
  return left.isLeft()
    ? right.isLeft()
      ? Either.left(left.left + right.left)
      : right
    : left.isRight()
    ? right.isRight()
      ? Either.right(left.right.concat(right.right))
      : right
    : (() => {
        throw new Error("absurd");
      })();
});
