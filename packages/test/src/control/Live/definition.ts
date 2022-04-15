import type { Console } from "@fncts/io/Console";
import type { Erase } from "@fncts/typelevel/Intersection";

/**
 * @tsplus static fncts.test.control.LiveOps Tag
 */
export const LiveTag = Tag<Live>();

type IOEnv = Has<Clock> & Has<Random> & Has<Console>;

/**
 * @tsplus companion fncts.test.control.LiveOps
 */
export abstract class Live {
  abstract provide<E, A>(io: IO<IOEnv, E, A>): IO<unknown, E, A>;

  static Default: Layer<IOEnv, never, Has<Live>> = Layer.fromIO(
    IO.environmentWith(
      (env) =>
        new (class extends Live {
          provide<E, A>(io: IO<IOEnv, E, A>): IO<unknown, E, A> {
            return io.provideEnvironment(env);
          }
        })(),
    ),
    LiveTag,
  );

  static Live<E, A>(io: IO<IOEnv, E, A>): IO<Has<Live>, E, A> {
    return IO.serviceWithIO((live) => live.provide(io), LiveTag);
  }
}

/**
 * @tsplus static fncts.test.control.LiveOps withLive
 */
export function withLive_<R, E, A, E1, B>(
  io: IO<R, E, A>,
  f: (_: IO<unknown, E, A>) => IO<IOEnv, E1, B>,
): IO<Erase<R, Has<Live>>, E | E1, B> {
  // @ts-expect-error
  return IO.environment<R & Has<Live>>().chain((r) => Live.Live(f(io.provideEnvironment(r))));
}

export function withLive<E, A, E1, B>(
  f: (_: IO<unknown, E, A>) => IO<IOEnv, E1, B>,
): <R>(io: IO<R, E, A>) => IO<Erase<R, Has<Live>>, E | E1, B> {
  return (io) => withLive_(io, f);
}
