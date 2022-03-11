import type { Exit } from "../../data/Exit";
import type { Maybe } from "../../data/Maybe";
import type { RuntimeFiber } from "../Fiber";
import type { IO } from "../IO";

import { Supervisor } from "./definition";

/**
 * @tsplus fluent fncts.control.Supervisor zip
 */
export function zip_<A, B>(fa: Supervisor<A>, fb: Supervisor<B>): Supervisor<readonly [A, B]> {
  return new (class extends Supervisor<readonly [A, B]> {
    value = fa.value.zip(fb.value);
    unsafeOnStart<R, E, A>(
      environment: R,
      effect: IO<R, E, A>,
      parent: Maybe<RuntimeFiber<any, any>>,
      fiber: RuntimeFiber<E, A>,
    ) {
      try {
        fa.unsafeOnStart(environment, effect, parent, fiber);
      } finally {
        fb.unsafeOnStart(environment, effect, parent, fiber);
      }
    }
    unsafeOnEnd<E, A>(value: Exit<E, A>, fiber: RuntimeFiber<E, A>) {
      fa.unsafeOnEnd(value, fiber);
      fb.unsafeOnEnd(value, fiber);
    }
    unsafeOnEffect<E, A>(fiber: RuntimeFiber<E, A>, effect: IO<any, any, any>) {
      fa.unsafeOnEffect(fiber, effect);
      fb.unsafeOnEffect(fiber, effect);
    }
    unsafeOnSuspend<E, A>(fiber: RuntimeFiber<E, A>) {
      fa.unsafeOnSuspend(fiber);
      fb.unsafeOnSuspend(fiber);
    }
    unsafeOnResume<E, A>(fiber: RuntimeFiber<E, A>) {
      fa.unsafeOnResume(fiber);
      fb.unsafeOnResume(fiber);
    }
  })();
}
