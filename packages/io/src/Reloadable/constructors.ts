import { Reloadable } from "./definition.js";

/**
 * @tsplus static fncts.io.ReloadableOps auto
 */
export function auto<In, E, Out, Env>(
  layer: Layer<In, E, Out>,
  tag: Tag<Out>,
  schedule: Schedule<Env, any, any>,
  /** @tsplus auto */ reloadableTag: Tag<Reloadable<Out>>
): Layer<In | Env, E, Reloadable<Out>> {
  return Layer.scoped(
    Do((Δ) => {
      const env        = Δ(Reloadable.manual(layer, tag, reloadableTag).build);
      const reloadable = env.unsafeGet(reloadableTag);
      Δ(IO.acquireRelease(reloadable.reload.schedule(schedule).forkDaemon, (fiber) => fiber.interrupt));
      return reloadable;
    }),
    reloadableTag,
  );
}

/**
 * @tsplus static fncts.io.ReloadableOps autoFromConfig
 */
export function autoFromConfig<In, E, Out, Env>(
  layer: Layer<In, E, Out>,
  tag: Tag<Out>,
  scheduleFromConfig: (env: Environment<In>) => Schedule<Env, any, any>,
  /** @tsplus auto */ reloadableTag: Tag<Reloadable<Out>>
): Layer<In | Env, E, Reloadable<Out>> {
  return Layer.scoped(
    Do((Δ) => {
      const inp      = Δ(IO.environment<In>());
      const schedule = scheduleFromConfig(inp);
      const env      = Δ(Reloadable.auto(layer, tag, schedule).build);
      return env.unsafeGet(reloadableTag);
    }),
    reloadableTag,
  );
}

/**
 * @tsplus static fncts.io.ReloadableOps manual
 */
export function manual<In, E, Out>(
  layer: Layer<In, E, Out>,
  tag: Tag<Out>,
  /** @tsplus auto */ reloadableTag: Tag<Reloadable<Out>>,
): Layer<In, E, Reloadable<Out>> {
  return Layer.scoped(
    Do((Δ) => {
      const inp    = Δ(IO.environment<In>());
      const ref    = Δ(ScopedRef.fromAcquire(layer.build.map((env) => env.unsafeGet(tag))));
      const reload = ref.set(layer.build.map((env) => env.unsafeGet(tag))).provideEnvironment(inp);
      return new Reloadable(ref, reload);
    }),
    reloadableTag,
  );
}
