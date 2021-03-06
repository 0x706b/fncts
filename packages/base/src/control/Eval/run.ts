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
      case EvalTag.Chain:
        concrete(cur.self);
        switch (cur.self._tag) {
          case EvalTag.Value:
            cur = cur.f(cur.self.value);
            break;
          default:
            frames.push(cur.f);
            cur = cur.self;
            break;
        }
        break;
      case EvalTag.Defer:
        cur = cur.make();
        break;
      case EvalTag.Value:
        out = cur.value;
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
