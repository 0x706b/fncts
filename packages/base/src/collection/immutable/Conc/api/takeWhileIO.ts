import { IO } from "../../../../control/IO.js";
import { Conc, concrete } from "../definition.js";

/**
 * @tsplus fluent fncts.collection.immutable.Conc takeWhileIO
 */
export function takeWhileIO_<A, R, E>(
  as: Conc<A>,
  p: (a: A) => IO<R, E, boolean>,
): IO<R, E, Conc<A>> {
  return IO.defer(() => {
    concrete(as);
    let taking: IO<R, E, boolean> = IO.succeedNow(true);
    const out                     = Conc.builder<A>();
    const iterator                = as.arrayIterator();
    let result: IteratorResult<ArrayLike<A>>;
    while (!(result = iterator.next()).done) {
      const array = result.value;
      for (let i = 0; i < array.length; i++) {
        const j = i;
        taking  = taking.chain((b) => {
          const a = array[j]!;
          return (b ? p(a) : IO.succeedNow(false)).map((b1) => {
            if (b1) {
              out.append(a);
              return true;
            } else {
              return false;
            }
          });
        });
      }
    }
    return taking.as(out.result());
  });
}
