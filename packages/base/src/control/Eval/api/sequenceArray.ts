/**
 * @tsplus static fncts.control.EvalOps sequenceArray
 */
export function sequenceArray<A>(evals: ReadonlyArray<Eval<A>>): Eval<ReadonlyArray<A>> {
  return Eval.defer(Eval.now(evals.map((computation) => computation.run)));
}
