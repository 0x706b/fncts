import type { LayerContext } from "../LayerContext.js";

import React from "react";

const FakeLayerContext = React.createContext<Future<never, Environment<any>> | null>(null);

export interface UseIOHookParams<R1> {
  readonly LayerContext?: LayerContext<R1>;
}

export type UseIOHookReturn<R, E, A, R1 = never> = [
  IO<Exclude<R, R1>, E, A>,
  DatumEither<Cause<E>, A>,
  {
    interrupt: UIO<void>;
    fiber: React.MutableRefObject<Fiber<E, A> | null>;
  },
];

export function useIO<R, E, A, R1 = never>(
  io: IO<R, E, A>,
  params?: UseIOHookParams<R1>,
): UseIOHookReturn<R, E, A, R1> {
  const [data, setData] = React.useState(DatumEither.initial<Cause<E>, A>());

  const { LayerContext } = params ?? {};

  const LayerFuture = React.useContext(LayerContext?.LayerFutureContext ?? FakeLayerContext);

  const ref = React.useRef<Fiber<E, A> | null>(null);

  const runIO = React.useMemo(() => {
    let runIO: IO<any, E, A>;

    if (LayerFuture) {
      runIO = LayerFuture.await.flatMap((environment) => io.provideSomeEnvironment(environment));
    } else {
      runIO = io;
    }

    return (
      IO(setData((data) => data.toPending)) >
      runIO.matchCauseIO(
        (cause) => IO(setData(DatumEither.repleteLeft(cause))) > IO.refailCause(cause),
        (a) => IO(setData(DatumEither.repleteRight(a))) > IO.succeedNow(a),
      )
    );
  }, [io]);

  const interrupt = React.useMemo(
    () =>
      IO.fiberId.flatMap((fiberId) =>
        IO(ref.current).flatMap((runningFiber) => {
          if (runningFiber === null) {
            return IO.unit;
          } else {
            return IO((ref.current = null)) > runningFiber.interruptAsFork(fiberId);
          }
        }),
      ),
    [],
  );

  const run = React.useMemo(
    () =>
      IO.environment<Exclude<R, R1>>().flatMap((environment) =>
        IO.defer(() => {
          const fiber = runIO.provideEnvironment(environment).unsafeRunFiber();
          ref.current = fiber;
          return fiber.join;
        }),
      ),
    [runIO],
  );

  return [interrupt > run, data, { interrupt, fiber: ref }] as UseIOHookReturn<R, E, A, R1>;
}
