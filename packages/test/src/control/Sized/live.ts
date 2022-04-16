import { Sized } from "./definition.js";

/**
 * @tsplus static fncts.test.SizedOps Live
 */
export function Live(size: number): Layer<unknown, never, Has<Sized>> {
  return Layer.fromIO(
    FiberRef.make(size).map(
      (ref) =>
        new (class extends Sized {
          size = ref.get;
          withSize(size: number) {
            return <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => ref.locally(size)(io);
          }
        })(),
    ),
    Sized.Tag,
  );
}
