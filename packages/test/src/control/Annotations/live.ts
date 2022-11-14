import { TestAnnotation } from "../../data/TestAnnotation.js";
import { TestAnnotationMap } from "../../data/TestAnnotationMap.js";
import { Annotations } from "./definition.js";

export class LiveAnnotations extends Annotations {
  constructor(private fiberRef: FiberRef<TestAnnotationMap>) {
    super();
  }
  annotate<V>(key: TestAnnotation<V>, value: V): UIO<void> {
    return this.fiberRef.update((map) => map.annotate(key, value));
  }
  get<V>(key: TestAnnotation<V>) {
    return this.fiberRef.get.map((map) => map.get(key));
  }
  withAnnotation<R, E, A>(io: IO<R, E, A>) {
    return this.fiberRef.locally(TestAnnotationMap.empty)(
      io.matchIO(
        (e) => this.fiberRef.get.map((m) => [e, m] as const).swap,
        (a) => this.fiberRef.get.map((m) => [a, m] as const),
      ),
    );
  }
  supervisedFibers = IO.descriptorWith((descriptor) =>
    this.fiberRef.get
      .map((m) => m.get(TestAnnotation.Fibers))
      .flatMap((r) =>
        r.match(
          () => IO.succeed(HashSet.empty<Fiber.Runtime<any, any>>()),
          (refs) =>
            IO.foreach(refs, (ref) => ref.get)
              .map((fibers) => fibers.foldLeft(HashSet.empty<Fiber.Runtime<any, any>>(), (s1, s2) => s1.union(s2)))
              .map((s) => s.filter((f) => Equatable.strictEquals(f.id, descriptor.id))),
        ),
      ),
  );
}

/**
 * @tsplus static fncts.test.AnnotationsOps Live
 */
export const live = Layer.scoped(
  FiberRef.make(TestAnnotationMap.empty).map((fiberRef) => new LiveAnnotations(fiberRef)),
  Annotations.Tag,
);
