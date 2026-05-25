/**
 * @tsplus static fncts.io.IOOps foreachWithIndexDiscardAsync
 */
export function foreachWithIndexDiscardAsync<R, E, A, B>(
  as: AsyncIterable<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return IO.defer(() => {
    const iterator = as[Symbol.asyncIterator]();
    let done       = false;

    return foreachWithIndexDiscardAsyncLoop(iterator, f, () => {
      done = true;
    }).onExit((exit) => (done || exit.isSuccess() ? IO.unit : closeAsyncIterator(iterator)));
  });
}

function foreachWithIndexDiscardAsyncLoop<R, E, A, B>(
  iterator: AsyncIterator<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  onDone: () => void,
  i = 0,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return IO.async<never, never, IteratorResult<A>>((k) => {
    iterator.next().then(
      (result) => k(IO.succeedNow(result)),
      (err) => k(IO.haltNow(err)),
    );
  })
    .flatMap((result) => {
      if (result.done) {
        return IO(() => {
          onDone();
          return true;
        });
      }
      return f(i, result.value).as(false);
    })
    .flatMap((done) => (done ? IO.unit : foreachWithIndexDiscardAsyncLoop(iterator, f, onDone, i + 1)));
}

function closeAsyncIterator<A>(iterator: AsyncIterator<A>): UIO<void> {
  return IO.async<never, never, void>((k) => {
    const return_ = iterator.return;

    if (return_ === undefined) {
      k(IO.unit);
      return;
    }

    return_.call(iterator).finally(() => k(IO.unit));
  });
}

/**
 * @tsplus static fncts.io.IOOps foreachWithIndexAsync
 */
export function foreachWithIndexAsync<R, E, A, B>(
  as: AsyncIterable<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const out: Array<B> = [];
    return IO.foreachWithIndexDiscardAsync(as, (i, a) => f(i, a).flatMap((b) => IO(out.push(b)))).map(() =>
      Conc.fromArray(out),
    );
  });
}

/**
 * @tsplus static fncts.io.IOOps foreachDiscardAsync
 */
export function foreachDiscardAsync<R, E, A, B>(
  as: AsyncIterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, void> {
  return IO.foreachWithIndexDiscardAsync(as, (i, a) => f(a));
}

/**
 * @tsplus static fncts.io.IOOps foreachAsync
 */
export function foreachAsync<R, E, A, B>(
  as: AsyncIterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string,
): IO<R, E, Conc<B>> {
  return IO.foreachWithIndexAsync(as, (_, a) => f(a));
}

/**
 * @tsplus static fncts.io.IOOps fromAsyncIterable
 */
export function fromAsyncIterable<A>(self: AsyncIterable<A>): IO<never, never, Conc<A>> {
  return IO.defer(() => {
    const out: Array<A> = [];
    return IO.foreachWithIndexDiscardAsync(self, (_, a) => IO(out.push(a))).map(() => Conc.fromArray(out));
  });
}
