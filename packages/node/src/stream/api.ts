import type stream from "node:stream";

import { Stream } from "@fncts/io/Stream";

export class ReadableError {
  readonly _tag = "ReadableError";
  constructor(readonly error: Error) {}
}

export function fromReadable(readable: Lazy<stream.Readable>): Stream<never, ReadableError, Byte> {
  return Stream.acquireRelease(
    IO.tryCatch(readable, (err) => new ReadableError(err as Error)),
    (readable) => IO(readable.destroy()),
  ).flatMap((readable) =>
    Stream.async((cb) => {
      readable.on("data", (chunk) => {
        cb(IO.succeedNow(Conc.fromBuffer(chunk)));
      });
      readable.on("error", (err) => {
        cb(IO.failNow(Just(new ReadableError(err))));
      });
      readable.on("end", () => {
        cb(IO.failNow(Nothing()));
      });
    }),
  );
}

export class WritableError {
  readonly _tag = "ReadableError";
  constructor(readonly error: Error) {}
}

export function fromWritable(writable: Lazy<stream.Writable>): Sink<never, WritableError, Byte, never, void> {
  return new Sink(
    Channel.unwrapScoped(
      IO.async<never, never, stream.Writable>((cb) => {
        let handle: NodeJS.Immediate | undefined = undefined;
        const onError = (err: Error) => {
          clearImmediate(handle);
          cb(IO.haltNow(err));
        };

        const writable0 = writable().once("error", onError);
        handle          = setImmediate(() => {
          writable0.removeListener("error", onError);
          cb(IO.succeedNow(writable0));
        });
      })
        .acquireRelease((writable) => IO(writable.destroy()))
        .map((writable) => {
          const reader: Channel<never, never, Conc<Byte>, unknown, WritableError, never, void> = Channel.readWith(
            (chunk: Conc<Byte>) =>
              Channel.unwrap(
                IO.async<never, WritableError, typeof reader>((cb) => {
                  writable.write(chunk.toBuffer, (err) => {
                    err ? cb(IO.failNow(new WritableError(err))) : cb(IO.succeedNow(reader));
                  });
                }),
              ),
            Channel.failNow,
            () => Channel.unit,
          );
          return reader;
        }),
    ),
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
      ),
    );
  };
}
