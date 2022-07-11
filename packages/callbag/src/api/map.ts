/**
 * @tsplus fluent fncts.callbag.Source map
 */
export function map<E, A, B>(self: Source<E, A>, f: (a: A) => B): Source<E, B> {
  return (_, sink) => {
    self(
      Signal.Start,
      Sink((t, d) => {
        if (t === Signal.Data) {
          sink(t, f(d));
        } else {
          sink.merged(t, d);
        }
      }),
    );
  };
}
