import { isPromiseLike } from "@fncts/base/data/Equatable";
import { isPromise } from "@fncts/base/util/predicates";
import { isIO } from "@fncts/io/IO";

/**
 * @tsplus pipeable fncts.io.IO andThen
 */
export function andThen<A, B>(f: (a: NoInfer<A>) => B) {
  return <R, E>(
    self: IO<R, E, A>,
  ): [B] extends [IO<infer R1, infer E1, infer A1>]
    ? IO<R | R1, E | E1, A1>
    : [B] extends [PromiseLike<infer A1>]
      ? IO<R, unknown, A1>
      : IO<R, E, B> => {
    // @ts-expect-error
    return self.flatMap((a) => {
      const b = f(a);
      if (isIO(b)) {
        return b;
      } else if (isPromise(b)) {
        return IO.async<never, unknown, unknown>((resolve) => {
          b.then(
            (a) => resolve(IO.succeedNow(a)),
            (e) => resolve(IO.failNow(e)),
          );
        });
      }

      return IO.succeedNow(b);
    });
  };
}
