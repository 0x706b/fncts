/**
 * @tsplus getter fncts.callbag.Source flatten
 */
export function flatten<E, E1, A>(source: Source<E, Source<E1, A>>): Source<E | E1, A> {
  return (_, sink) => {
    let outerTalkback: Talkback<any>;
    let innerTalkback: Talkback<any>;
    const talkback: Talkback<any> = Talkback((t, d) => {
      if (t === Signal.Data) {
        (innerTalkback || outerTalkback).merged(Signal.Data, d);
      }
      if (t === Signal.End) {
        innerTalkback && innerTalkback(Signal.End);
        outerTalkback && outerTalkback(Signal.End);
      }
    });

    source(
      Signal.Start,
      Sink((t, d) => {
        if (t === Signal.Start) {
          outerTalkback = d;
          sink(Signal.Start, talkback);
        } else if (t === Signal.Data) {
          const innerSource = d;
          innerTalkback && innerTalkback(Signal.End);
          innerSource(
            Signal.Start,
            Sink((innerT, innerD) => {
              if (innerT === Signal.Start) {
                innerTalkback = innerD;
                innerTalkback(Signal.Data);
              } else if (innerT === Signal.Data) {
                sink(Signal.Data, innerD);
              } else if (innerT === Signal.End && !!innerD) {
                outerTalkback && outerTalkback(Signal.End);
                sink(Signal.End, innerD);
              } else if (innerT === Signal.End) {
                if (!outerTalkback) sink(Signal.End);
                else {
                  innerTalkback = null!;
                  outerTalkback(Signal.Data);
                }
              }
            }),
          );
        } else if (t === Signal.End && !!d) {
          innerTalkback && innerTalkback(Signal.End);
          sink(Signal.End, d);
        } else if (t === Signal.End) {
          if (!outerTalkback) sink(Signal.End);
          else {
            outerTalkback = null!;
          }
        }
      }),
    );
  };
}
