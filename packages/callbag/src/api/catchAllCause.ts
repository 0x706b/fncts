/**
 * @tsplus fluent fncts.callbag.Source catchAllCause
 */
export function catchAllCause<E, A, E1, B>(
  self: Source<E, A>,
  f: (cause: Cause<E>) => Source<E1, B>,
): Source<E1, A | B> {
  return (_, sink) => {
    let innerTalkback: Talkback<any>;
    const talkback: Talkback<any> = (signal) => innerTalkback.merged(signal);

    const replaceSource = (source: Source<E | E1, A | B>, initial = false) => {
      source(
        Signal.Start,
        Sink((t, d) => {
          if (t === Signal.Start) {
            innerTalkback = d;

            if (initial) {
              sink(Signal.Start, talkback);
            }

            talkback(Signal.Data);
          } else if (initial && t === Signal.End && !!d) {
            replaceSource(f(d as Cause<E>));
          } else {
            sink.merged(t, Function.unsafeCoerce(d));
          }
        }),
      );
    };

    replaceSource(self, true);
  };
}
