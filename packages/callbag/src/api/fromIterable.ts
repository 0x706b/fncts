/**
 * @tsplus static fncts.callbag.SourceOps fromIterable
 */
export function fromIterable<A>(iterable: Iterable<A>): Source<never, A> {
  return (_, sink) => {
    const iterator = iterable[Symbol.iterator]();
    let inLoop     = false;
    let got1       = false;
    let completed  = false;
    let res: IteratorResult<A>;
    function loop() {
      inLoop = true;
      while (got1 && !completed) {
        got1 = false;
        res  = iterator.next();
        if (res.done) {
          sink(Signal.End);
          break;
        } else {
          sink(Signal.Data, res.value);
        }
      }
      inLoop = false;
    }
    sink(Signal.Start, (t) => {
      if (completed) return;

      if (t === Signal.Data) {
        got1 = true;
        if (!inLoop && !(res && res.done)) loop();
      } else if (t === Signal.End) {
        completed = true;
      }
    });
  };
}
