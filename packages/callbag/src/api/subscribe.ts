export interface Observer<E, A> {
  readonly next?: (value: A) => void;
  readonly error?: (value: Cause<E>) => void;
  readonly complete?: () => void;
}

export type SimpleObserver<A> = (value: A) => void;

/**
 * @tsplus fluent fncts.callbag.Source subscribe
 */
export function subscribe<E, A>(source: Source<E, A>, observer: Observer<E, A> | SimpleObserver<A> = {}): () => void {
  if (typeof observer === "function") {
    observer = { next: observer };
  }

  const { next, error, complete } = observer;
  let talkback: Talkback<E> | undefined;

  source(
    Signal.Start,
    Sink((t, d) => {
      switch (t) {
        case Signal.Start: {
          talkback = d;
          talkback(Signal.Data);
          break;
        }
        case Signal.Data: {
          if (next) next(d);
          if (talkback) talkback(Signal.Data);
          break;
        }
        case Signal.End: {
          if (!d && complete) complete();
          if (!!d && error) error(d);
          break;
        }
      }
    }),
  );

  const dispose = () => {
    if (talkback) talkback(Signal.End);
  };

  return dispose;
}
