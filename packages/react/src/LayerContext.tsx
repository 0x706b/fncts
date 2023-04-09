import React from "react";

export interface LayerContext<R> {
  readonly LayerFutureContext: React.Context<Future<never, Environment<R>> | null>;
  readonly useProvider: () => <E, A>(io: IO<R, E, A>) => IO<never, E, A>;
  readonly Provider: (props: { children: React.ReactNode }) => JSX.Element;
}

export function makeLayerContext<R>(layer: Layer<never, never, R>): LayerContext<R> {
  const LayerFutureContext = React.createContext<Future<never, Environment<R>> | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    const future = React.useMemo(() => {
      return Future.unsafeMake<never, Environment<R>>(FiberId.none);
    }, []);

    React.useEffect(() => {
      const scope  = Scope.unsafeMake();
      const effect = layer.build(scope).fulfill(future);
      const fiber  = effect.unsafeRunFiber();

      return () => {
        fiber.interruptAs(FiberId.none).unsafeRunFiber();
        scope.close(Exit.interrupt(FiberId.none)).unsafeRunFiber();
      };
    }, []);

    return <LayerFutureContext.Provider value={future}>{children}</LayerFutureContext.Provider>;
  }

  return {
    LayerFutureContext,
    useProvider: (): (<E, A>(io: IO<R, E, A>) => IO<never, E, A>) => {
      const LayerFuture = React.useContext(LayerFutureContext);

      if (LayerFuture) {
        return (io) => LayerFuture.await.flatMap((environment) => io.provideEnvironment(environment));
      } else {
        throw new Error(
          "[fncts] LayerContext not found. Did you forget to wrap the application in <LayerContext.Provider>?",
        );
      }
    },
    Provider: ({ children }: { children: React.ReactNode }) => {
      const LayerFuture = React.useContext(LayerFutureContext);

      if (LayerFuture) {
        return <LayerFutureContext.Provider value={LayerFuture}>{children}</LayerFutureContext.Provider>;
      } else {
        return <Provider>{children}</Provider>;
      }
    },
  };
}
