import { TestAnnotation } from "./definition.js";

export const IgnoredTag = Tag<number>();
/**
 * @tsplus static fncts.test.TestAnnotationOps Ignored
 */
export const Ignored = new TestAnnotation(IgnoredTag, "ignored", 0, (x, y) => x + y);

export const RepeatedTag = Tag<number>();
/**
 * @tsplus static fncts.test.TestAnnotationOps Repeated
 */
export const Repeated = new TestAnnotation(RepeatedTag, "repeated", 0, (x, y) => x + y);

export const RetriedTag = Tag<number>();
/**
 * @tsplus static fncts.test.TestAnnotationOps Retried
 */
export const Retried = new TestAnnotation(RetriedTag, "retried", 0, (x, y) => x + y);

export const TaggedTag = Tag<HashSet<string>>();
/**
 * @tsplus static fncts.test.TestAnnotationOps Tagged
 */
export const Tagged = new TestAnnotation(TaggedTag, "tagged", HashSet.makeDefault(), (x, y) => x.union(y));

export const TimingTag = Tag<number>();
/**
 * @tsplus static fncts.test.TestAnnotationOps Timing
 */
export const Timing = new TestAnnotation(TimingTag, "timing", 0, (x, y) => x + y);

export const FibersTag = Tag<Either<number, Conc<Ref<HashSet<Fiber.Runtime<any, any>>>>>>();
/**
 * @tsplus static fncts.test.TestAnnotationOps Fibers
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
