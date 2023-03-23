import { IOEnv } from "@fncts/io/IOEnv";

/**
 * @tsplus static fncts.test.LiveOps Tag
 */
export const LiveTag = Tag<Live>("fncts.test.Live");

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
  static live<R extends Live, E, A>(io: IO<R, E, A>): IO<R | Live, E, A> {
    return IO.serviceWithIO((live) => live.provide(io), LiveTag);
  }
}

/**
 * @tsplus static fncts.io.IOOps liveWith
 */
export function liveWith<R, E, A>(f: (live: Live) => IO<R, E, A>): IO<R | Live, E, A> {
  return IO.environmentWithIO((environment) => f(environment.get(Live.Tag)));
}

/**
 * @tsplus static fncts.test.LiveOps withLive
 */
export function withLive<R extends Live, E, A>(io: IO<R, E, A>) {
  return <E1, B>(f: (_: IO<R, E, A>) => IO<R, E1, B>): IO<R | Live, E1, B> =>
    IOEnv.services.getWith((services) => Live.live(f(IOEnv.services.locally(services)(io))));
}
