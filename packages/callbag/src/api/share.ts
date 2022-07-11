/**
 * @tsplus getter fncts.callbag.Source share
 */
export function share<E, A>(self: Source<E, A>): Source<E, A> {
  const sinks = new Set<Sink<E, any, A>>();
  let sourceTalkback: Talkback<E> | undefined;

  return (_, sink) => {
    sinks.add(sink);

    const talkback: Talkback<E> = Talkback((t, d) => {
      if (t === Signal.End) {
        sinks.delete(sink);
        if (sinks.size === 0) {
          sourceTalkback!(Signal.End);
        }
      } else {
        sourceTalkback!.merged(t, d);
      }
    });

    if (sinks.size === 1) {
      self(
        Signal.Start,
        Sink((t, d) => {
          if (t === Signal.Start) {
            sourceTalkback = d;
            sink(Signal.Start, talkback);
          } else {
            sinks.forEach((sink) => {
              sink.merged(t, d);
            });
          }
          if (t === Signal.End) {
            sinks.clear();
          }
        }),
      );
    }

    sink(Signal.Start, talkback);
  };
}
