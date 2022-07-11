/**
 * @tsplus static fncts.callbag.SourceOps succeed
 */
export function succeed<A>(value: Lazy<A>): Source<never, A> {
  return (_, sink) => {
    let emit = false;
    if (!emit) {
      sink(Signal.Data, value());
      emit = true;
    } else {
      sink(Signal.End);
    }
  };
}
