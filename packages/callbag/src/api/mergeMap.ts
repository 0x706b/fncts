/**
 * @tsplus fluent fncts.callbag.Source mergeMap
 */
export function mergeMap<E, A, E1, B>(self: Source<E, A>, f: (a: A) => Source<E1, B>): Source<E | E1, B> {
  return (_, sink) => {
    let index = 0;
    const talkbacks: Record<number, Talkback<any>> = {};
    let sourceEnded = false;
    let inputSourceTalkback: Talkback<any> = null!;

    const pullHandle: Talkback<any> = Talkback((t, d) => {
      const currTalkback = Object.values(talkbacks).pop();
      if (t === Signal.Data) {
        if (currTalkback) currTalkback(Signal.Data);
        else if (!sourceEnded) inputSourceTalkback(Signal.Data);
        else sink(Signal.End);
      }
      if (t === Signal.End) {
        if (currTalkback) currTalkback(Signal.End);
        inputSourceTalkback(Signal.End);
      }
    });

    const stopOrContinue = (d?: Cause<E | E1>) => {
      if (sourceEnded && Object.keys(talkbacks).length === 0) sink(Signal.End, d);
      else inputSourceTalkback(Signal.Data);
    };

    const makeSink = (i: number): Sink<E | E1, any, B> =>
      Sink((t, d) => {
        switch (t) {
          case Signal.Start: {
            talkbacks[i] = d;
            talkbacks[i]!(Signal.Data);
            break;
          }
          case Signal.Data: {
            sink(Signal.Data, d);
            break;
          }
          case Signal.End: {
            delete talkbacks[i];
            stopOrContinue(d);
            break;
          }
        }
      });

    self(
      Signal.Start,
      Sink((t, d) => {
        switch (t) {
          case Signal.Start: {
            inputSourceTalkback = d;
            sink(Signal.Start, pullHandle);
            break;
          }
          case Signal.Data: {
            f(d)(Signal.Start, makeSink(index++));
            break;
          }
          case Signal.End: {
            sourceEnded = true;
            stopOrContinue(d);
          }
        }
      }),
    );
  };
}
