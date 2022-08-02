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

  static Default: Layer<IOEnv, never, Live> = Layer.fromIO(
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

  static Live<R extends Live, E, A>(io: IO<R, E, A>): IO<R | Live, E, A> {
    return IO.serviceWithIO((live) => live.provide(io), LiveTag);
  }
}

/**
 * @tsplus static fncts.test.LiveOps withLive
 */
export function withLive_<R, E, A, E1, B>(
  io: IO<R, E, A>,
  f: (_: IO<never, E, A>) => IO<IOEnv, E1, B>,
): IO<Exclude<R, Live>, E | E1, B> {
  // @ts-expect-error
  return IO.environment<R | Live>().flatMap((r) => Live.Live(f(io.provideEnvironment(r))));
}

export function withLive<R extends Live, E, A>(io: IO<R, E, A>) {
  return <E1, B>(f: (_: IO<R, E, A>) => IO<R, E1, B>): IO<R | Live, E1, B> =>
    IOEnv.services.getWith((services) => Live.Live(f(IOEnv.services.locally(services)(io))));
}
