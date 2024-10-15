import { concrete, EvalTag } from "@fncts/base/control/Eval/definition";
import { Stack } from "@fncts/base/internal/Stack";

/**
 * @tsplus getter fncts.control.Eval run
 * @tsplus static fncts.control.EvalOps run
 */
export function run<A>(computation: Eval<A>): A {
  const frames = Stack<(a: any) => Eval<any>>();
  let out      = undefined;
  let cur      = computation;
  while (cur !== null) {
    concrete(cur);
    switch (cur._tag) {
      case EvalTag.FlatMap:
        concrete(cur.i0);
        switch (cur.i0._tag) {
          case EvalTag.Value:
            cur = cur.i1(cur.i0.i0);
            break;
          default:
            frames.push(cur.i1);
            cur = cur.i0;
            break;
        }
        break;
      case EvalTag.Defer:
        cur = cur.i0();
        break;
      case EvalTag.Value:
        out = cur.i0;
        if (frames.hasNext) {
          cur = frames.pop()!(out);
        } else {
          cur = null!;
        }
        break;
    }
  }
  return out;
}
