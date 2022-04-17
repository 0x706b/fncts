import type { Erase } from "@fncts/typelevel/Intersection";

import { IOEnv } from "@fncts/io/IOEnv";

/**
 * @tsplus static fncts.test.LiveOps Tag
 */
export const LiveTag = Tag<Live>();

/**
 * @tsplus companion fncts.test.LiveOps
 */
export abstract class Live {
  abstract provide<R, E, A>(io: IO<R, E, A>): IO<R, E, A>;

  static Default: Layer<IOEnv, never, Has<Live>> = Layer.fromIO(
    IO.environmentWith(
      (env) =>
        new (class extends Live {
          provide<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
            return IOEnv.services.locallyWith((_) => _.union(env))(io);
          }
        })(),
    ),
    LiveTag,
  );

  static Live<R extends Has<Live>, E, A>(io: IO<R, E, A>): IO<R & Has<Live>, E, A> {
    return IO.serviceWithIO((live) => live.provide(io), LiveTag);
  }
}

/**
 * @tsplus static fncts.test.LiveOps withLive
 */
export function withLive_<R, E, A, E1, B>(
  io: IO<R, E, A>,
  f: (_: IO<unknown, E, A>) => IO<IOEnv, E1, B>,
): IO<Erase<R, Has<Live>>, E | E1, B> {
  // @ts-expect-error
  return IO.environment<R & Has<Live>>().flatMap((r) => Live.Live(f(io.provideEnvironment(r))));
}

export function withLive<R extends Has<Live>, E, A>(io: IO<R, E, A>) {
  return <E1, B>(f: (_: IO<R, E, A>) => IO<R, E1, B>): IO<R & Has<Live>, E1, B> =>
    IOEnv.services.getWith((services) => Live.Live(f(IOEnv.services.locally(services)(io))));
}
