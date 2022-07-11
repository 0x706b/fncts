/**
 * @tsplus static fncts.callbag.SourceOps fail
 */
export function fail<E>(e: E): Source<E, never> {
  return (_, sink) => {
    let disposed = false;

    sink(Signal.Start, (t) => {
      if (t !== Signal.End) return;
      disposed = true;
    });

    if (disposed) return;

    sink(Signal.End, Cause.fail(e));
  };
}
