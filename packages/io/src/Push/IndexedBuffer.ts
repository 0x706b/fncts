import type { Push } from "./definition.js";

export class IndexedBuffer<R, E, A> {
  constructor(
    public ready: boolean,
    readonly future: Future<never, void>,
    readonly sink: Push.UnsafeSink<R, E, A>,
    readonly onDone: UIO<void>,
  ) {}

  buffer: Array<A> = [];

  onSuccess(value: A) {
    if (this.ready) {
      if (this.buffer.length === 0) {
        return this.sink.onSuccess(value);
      }

      this.buffer.push(value);
      const b     = this.buffer;
      this.buffer = [];
      return IO.foreach(b, this.sink.onSuccess);
    } else {
      this.buffer.push(value);
      return IO.unit;
    }
  }

  get onEnd() {
    return (
      this.future.await >
      IO.defer(() => {
        if (this.buffer.length === 0) {
          return this.onDone;
        }
        const b     = this.buffer;
        this.buffer = [];
        return IO.foreach(b, this.sink.onSuccess) > this.onDone;
      })
    );
  }
}

export const withBuffers = <R, E, A>(
  size: number,
  sink: Push.UnsafeSink<R, E, A>,
  id: FiberId,
): {
  onSuccess: (index: number, value: A) => IO<R, never, void>;
  onEnd: (index: number) => IO<R, never, void>;
  buffers: Map<number, IndexedBuffer<R, E, A>>;
} => {
  const buffers = new Map<number, IndexedBuffer<R, E, A>>();
  const last    = size - 1;

  for (let i = 0; i < size; i++) {
    const future = Future.unsafeMake<never, void>(id);
    const ready  = i === 0;
    if (i === 0) {
      future.unsafeDone(IO.unit);
    }
    const onDone =
      i === last
        ? IO.unit
        : IO.defer(() => {
            const next = buffers.get(i + 1)!;
            next.ready = true;
            return next.future.done(Exit.unit);
          });

    buffers.set(i, new IndexedBuffer(ready, future, sink, onDone));
  }

  return {
    buffers,
    onSuccess: (index, value) => buffers.get(index)!.onSuccess(value),
    onEnd: (index) => buffers.get(index)!.onEnd,
  };
};
