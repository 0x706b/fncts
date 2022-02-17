import type { Array } from "../../../collection/immutable/Array";

import { Eval } from "../definition";

/**
 * @tsplus static fncts.EvalOps sequenceArray
 */
export function sequenceArray<A>(evals: Array<Eval<A>>): Eval<Array<A>> {
  return Eval.defer(Eval.now(evals.map((computation) => computation.run)));
}
