import type { AsyncInputProducer } from "@fncts/io/Channel/internal/AsyncInputProducer";
import type stream from "node:stream";

import { Stream } from "@fncts/io/Stream";

export class ReadableError {
  readonly _tag = "ReadableError";
  constructor(readonly error: Error) {}
}

export function fromReadable<E, A = Uint8Array>(
  readable: Lazy<stream.Readable | NodeJS.ReadableStream>,
  onError: (error: unknown) => E,
  chunkSize?: number,
): Stream<never, E, A> {
  return new Stream<never, E, A>(fromReadableChannel<E, A>(readable, onError, chunkSize));
}

function fromReadableChannel<E, A = Uint8Array>(
  evaluate: Lazy<stream.Readable | NodeJS.ReadableStream>,
  onError: (error: unknown) => E,
  chunkSize: number | undefined,
): Channel<never, unknown, unknown, unknown, E, Conc<A>, unknown> {
  return Channel.acquireReleaseWith(
    IO(evaluate)
      .zip(Queue.makeUnbounded<Either<Exit<E, void>, void>>())
      .tap(([readable, queue]) => readableOffer(readable, queue, onError)),
    ([readable, queue]) => readableTake(readable, queue, chunkSize),
    ([readable, queue]) =>
      IO(() => {
        readable.removeAllListeners();
        if ("closed" in readable && !readable.closed) {
          readable.destroy();
        }
      }) > queue.shutdown,
  );
}

function readableOffer<E>(
  readable: stream.Readable | NodeJS.ReadableStream,
  queue: Queue<Either<Exit<E, void>, void>>,
  onError: (error: unknown) => E,
) {
  return IO(() => {
    readable.on("readable", () => {
      const size = queue.unsafeSize;
      if (size.isJust() && size.value <= 0) {
        queue.offer(Either.right(void 0)).unsafeRun;
      }
    });
    readable.on("error", (err) => {
      queue.unsafeOffer(Either.left(Exit.fail(onError(err))));
    });
    readable.on("end", () => {
      queue.unsafeOffer(Either.left(Exit.unit));
    });
    if (readable.readable) {
      queue.unsafeOffer(Either.right(void 0));
    }
  });
}

function readableTake<E, A>(
  readable: stream.Readable | NodeJS.ReadableStream,
  queue: Queue<Either<Exit<E, void>, void>>,
  chunkSize: number | undefined,
) {
  const read = readChunkChannel<A>(readable, chunkSize);
  const loop: Channel<never, unknown, unknown, unknown, E, Conc<A>, unknown> = Channel.fromIO(queue.take).flatMap(
    (either) =>
      either.match({
        Left: (exit) =>
          exit.match(
            (cause) => Channel.failCauseNow(cause),
            () => Channel.unit,
          ),
        Right: () => read.flatMap(() => loop),
      }),
  );
  return loop;
}

function readChunkChannel<A>(readable: stream.Readable | NodeJS.ReadableStream, chunkSize: number | undefined) {
  return Channel.defer(() => {
    const arr: Array<A> = [];
    let chunk           = readable.read(chunkSize);
    while (chunk !== null) {
      arr.push(chunk);
      chunk = readable.read(chunkSize);
    }
    return Channel.write(Conc.fromArray(arr));
  });
}

export interface FromWritableOptions {
  readonly endOnDone?: boolean;
  readonly encoding?: BufferEncoding;
}

export function fromWritable<E, A = Uint8Array | string>(
  writable: Lazy<stream.Writable | NodeJS.WritableStream>,
  onError: (error: unknown) => E,
  options?: FromWritableOptions,
): Sink<never, E, A, never, void> {
  return Sink.fromChannel(fromWritableChannel(writable, onError, options));
}

export function fromWritableChannel<IE, OE, A>(
  writable: Lazy<stream.Writable | NodeJS.WritableStream>,
  onError: (error: unknown) => OE,
  options?: FromWritableOptions,
): Channel<never, IE, Conc<A>, unknown, IE | OE, never, void> {
  return Channel.fromIO(IO(writable).zip(Future.make<IE | OE, void>())).flatMap(([writable, future]) =>
    writableOutput(writable, future, onError).embedInput(
      writeInput<IE, A>(writable, (cause) => future.failCause(cause), options, future.fulfill(IO.unit)),
    ),
  );
}

function writeInput<IE, A>(
  writable: stream.Writable | NodeJS.WritableStream,
  onFailure: (cause: Cause<IE>) => UIO<void>,
  { encoding, endOnDone = true }: FromWritableOptions = {},
  onDone = IO.unit,
): AsyncInputProducer<IE, Conc<A>, unknown> {
  const write = writeIO(writable, encoding);
  const close = endOnDone
    ? IO.async<never, never, void>((resume) => {
        if ("closed" in writable && writable.closed) {
          resume(IO.unit);
        } else {
          writable.once("finish", () => resume(IO.unit));
        }
      })
    : IO.unit;

  return {
    awaitRead: IO.unit,
    emit: write,
    error: (cause) => close > onFailure(cause),
    done: (_) => close > onDone,
  };
}

function writeIO<A>(writable: stream.Writable | NodeJS.WritableStream, encoding?: BufferEncoding) {
  return (chunk: Conc<A>) => {
    if (chunk.length === 0) {
      return IO.unit;
    } else {
      return IO.async<never, never, void>((resume) => {
        const iterator = chunk[Symbol.iterator]();
        const next     = iterator.next();
        function loop() {
          const item    = next;
          const success = writable.write(item.value, encoding as any);
          if (next.done) {
            resume(IO.unit);
          } else if (success) {
            loop();
          } else {
            writable.once("drain", loop);
          }
        }
        loop();
      });
    }
  };
}

function writableOutput<IE, OE>(
  writable: stream.Writable | NodeJS.WritableStream,
  future: Future<IE | OE, void>,
  onError: (error: unknown) => OE,
) {
  return Channel.fromIO(
    IO.defer(() => {
      function handleError(err: unknown) {
        future.unsafeDone(IO.failNow(onError(err)));
      }
      writable.on("error", handleError);
      return future.await.ensuring(IO(writable.removeListener("error", handleError)));
    }),
  );
}

export class TransformError {
  readonly _tag = "TransformError";
  constructor(readonly error: Error) {}
}

/**
 * @tsplus pipeable fncts.io.Stream transform
 */
export function transform(transform: Lazy<stream.Transform>) {
  return <R, E>(self: Stream<R, E, Byte>): Stream<R, E | TransformError, Byte> => {
    const scopedSink = IO.succeed(transform)
      .acquireRelease((transform) => IO.succeed(transform.destroy()))
      .map((transform) => {
        const endTransform = IO.succeed(transform.end());
        const reader: Channel<never, E, Conc<Byte>, unknown, E | TransformError, Conc<Byte>, void> = Channel.readWith(
          (inp: Conc<Byte>) =>
            Channel.unwrap(
              IO.async<never, TransformError, typeof reader>((cb) => {
                transform.write(inp.toBuffer, (err) => {
                  err ? cb(IO.failNow(new TransformError(err))) : IO.succeedNow(reader);
                });
              }),
            ),
          (err) => Channel.unwrap(endTransform.map(() => Channel.failNow(err))),
          () => Channel.unwrap(endTransform.map(() => Channel.unit)),
        );
        return [transform, new Sink(reader)] as const;
      });
    return Stream.scoped(scopedSink).flatMap(([transform, sink]) =>
      Stream.asyncIO<never, TransformError, Byte, R, E | TransformError>((cb) =>
        IO.succeed(() => {
          transform.on("data", (chunk) => {
            cb(IO.succeed(Conc.fromBuffer(chunk)));
          });
          transform.on("error", (err) => {
            cb(IO.failNow(Just(new TransformError(err))));
          });
          transform.on("end", () => {
            cb(IO.failNow(Nothing()));
          });
        }).zipRight(self.run(sink)),
      ).ensuring(IO(transform.removeAllListeners())),
    );
  };
}

export function toString<E>(
  readable: Lazy<stream.Readable | NodeJS.ReadableStream>,
  onFailure: (error: unknown) => E,
  options?: {
    encoding?: BufferEncoding;
    maxBytes?: number;
  },
): IO<never, E, string> {
  const maxBytes = options?.maxBytes ? Number(options.maxBytes) : undefined;
  return IO(() => {
    const stream = readable();
    stream.setEncoding(options?.encoding ?? "utf8");
    return stream;
  })
    .acquireRelease((stream) =>
      IO(() => {
        stream.removeAllListeners();
        if ("closed" in stream && !stream.closed) {
          stream.destroy();
        }
      }),
    )
    .flatMap((stream) =>
      IO.async<never, E, string>((resume) => {
        let string = "";
        let bytes  = 0;
        stream.once("error", (err) => {
          resume(IO.failNow(onFailure(err)));
        });
        stream.once("end", () => {
          resume(IO.succeedNow(string));
        });
        stream.on("data", (chunk) => {
          string += chunk;
          bytes  += Buffer.byteLength(chunk);
          if (maxBytes && bytes > maxBytes) {
            resume(IO.failNow(onFailure(new Error("maxBytes exceeded"))));
          }
        });
      }),
    ).scoped;
}

export function toUint8Array<E>(
  readable: Lazy<stream.Readable | NodeJS.ReadableStream>,
  onFailure: (error: unknown) => E,
  options: {
    maxBytes?: number;
  } = {},
): IO<never, E, Uint8Array> {
  const maxBytes = options.maxBytes ? Number(options.maxBytes) : undefined;
  return IO(readable)
    .acquireRelease((stream) =>
      IO(() => {
        stream.removeAllListeners();
        if ("closed" in stream && !stream.closed) {
          stream.destroy();
        }
      }),
    )
    .flatMap((stream) =>
      IO.async<never, E, Uint8Array>((resume) => {
        let buffer = Buffer.alloc(0);
        let bytes  = 0;
        stream.once("error", (err) => {
          resume(IO.failNow(onFailure(err)));
        });
        stream.once("end", () => {
          resume(IO.succeedNow(buffer));
        });
        stream.on("data", (chunk) => {
          buffer = Buffer.concat([buffer, chunk]);
          bytes += chunk.length;
          if (maxBytes && bytes > maxBytes) {
            resume(IO.failNow(onFailure(new Error("maxBytes exceeded"))));
          }
        });
      }),
    ).scoped;
}
