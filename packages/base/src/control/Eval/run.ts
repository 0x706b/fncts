import { concrete, EvalTag } from "@fncts/base/control/Eval/definition";
import { Stack } from "@fncts/base/internal/Stack";

/**
 * @tsplus getter fncts.Eval run
 * @tsplus static fncts.EvalOps run
 */
export function run<A>(computation: Eval<A>): A {
  let frames: Stack<(a: any) => Eval<any>> | undefined = undefined;
  let out = undefined;
  let cur = computation;
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
            frames = Stack.make(cur.f, frames);
            cur    = cur.self;
            break;
        }
        break;
      case EvalTag.Defer:
        cur = cur.make();
        break;
      case EvalTag.Value:
        out = cur.value;
        if (frames) {
          cur    = frames.value(out);
          frames = frames.previous;
        } else {
          cur = null!;
        }
        break;
    }
  }
  return out;
}
