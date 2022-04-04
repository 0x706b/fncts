import { TestAnnotation } from "./definition.js";

export const IgnoredKey = Symbol.for("fncts.test.data.TestAnnotation.IgnoredKey");

export const IgnoredTag = Tag<number>(IgnoredKey);
/**
 * @tsplus static fncts.data.TestAnnotationOps Ignored
 */
export const Ignored = new TestAnnotation(IgnoredTag, "ignored", 0, (x, y) => x + y);

export const RepeatedKey = Symbol.for("fncts.test.data.TestAnnotation.RepeatedKey");

export const RepeatedTag = Tag<number>(RepeatedKey);
/**
 * @tsplus static fncts.data.TestAnnotationOps Repeated
 */
export const Repeated = new TestAnnotation(RepeatedTag, "repeated", 0, (x, y) => x + y);

export const RetriedKey = Symbol.for("fncts.test.data.TestAnnotation.RetriedKey");

export const RetriedTag = Tag<number>(RetriedKey);
/**
 * @tsplus static fncts.data.TestAnnotationOps Retried
 */
export const Retried = new TestAnnotation(RetriedTag, "retried", 0, (x, y) => x + y);

export const TaggedKey = Symbol.for("fncts.test.data.TestAnnotation.TaggedKey");

export const TaggedTag = Tag<HashSet<string>>(TaggedKey);
/**
 * @tsplus static fncts.data.TestAnnotationOps Tagged
 */
export const Tagged = new TestAnnotation(TaggedTag, "tagged", HashSet.makeDefault(), (x, y) =>
  x.union(y),
);

export const TimingKey = Symbol.for("fncts.test.data.TestAnnotation.TimingKey");

export const TimingTag = Tag<number>(TimingKey);
/**
 * @tsplus static fncts.data.TestAnnotationOps Timing
 */
export const Timing = new TestAnnotation(TimingTag, "timing", 0, (x, y) => x + y);

export const FibersKey = Symbol.for("fncts.test.data.TestAnnotation.FibersKey");

export const FibersTag = Tag<Either<number, Conc<Ref<HashSet<Fiber.Runtime<any, any>>>>>>(FibersKey);
/**
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
