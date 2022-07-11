/**
 * @tsplus static fncts.callbag.SourceOps interval
 */
export function interval(period: number): Source<never, number> {
  return (_, sink) => {
    let i        = 0;
    const handle = setInterval(() => {
      sink(Signal.Data, i++);
    }, period);
    sink(Signal.Start, (t) => {
      if (t === Signal.End) clearInterval(handle);
    });
  };
}
