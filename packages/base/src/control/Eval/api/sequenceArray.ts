import { Eval } from "../definition.js";

/**
 * @tsplus static fncts.EvalOps sequenceArray
 */
export function sequenceArray<A>(evals: ReadonlyArray<Eval<A>>): Eval<ReadonlyArray<A>> {
  return Eval.defer(Eval.now(evals.map((computation) => computation.run)));
}
