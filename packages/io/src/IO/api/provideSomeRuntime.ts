import type { Runtime } from "@fncts/io/IO";

import { FiberRefsPatch } from "@fncts/io/FiberRefs";
import { defaultRuntime } from "@fncts/io/IO";

/**
 * @tsplus pipeable fncts.io.IO provideSomeRuntime
 */
export function provideSomeRuntime<R>(runtime: Runtime<R>) {
  return <R1, E, A>(self: IO<R1, E, A>): IO<Exclude<R1, R>, E, A> => {
    const patchFlags        = defaultRuntime.runtimeFlags.diff(runtime.runtimeFlags);
    const inversePatchFlags = runtime.runtimeFlags.diff(defaultRuntime.runtimeFlags);
    const patchRefs         = FiberRefsPatch.diff(defaultRuntime.fiberRefs, runtime.fiberRefs);
    const inversePatchRefs  = FiberRefsPatch.diff(runtime.fiberRefs, defaultRuntime.fiberRefs);

    return IO.bracket(
      IO.updateRuntimeFlags(patchFlags) > IO.patchFiberRefs(patchRefs),
      () => self.provideSomeEnvironment(runtime.environment),
      () => IO.updateRuntimeFlags(inversePatchFlags) > IO.patchFiberRefs(inversePatchRefs),
    );
  };
}
