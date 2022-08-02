import * as fs from "fs";

type ErrnoException = NodeJS.ErrnoException;

interface FileDescriptorN extends HKT {
  type: FileDescriptor;
}
export interface FileDescriptor
  extends Newtype<
    {
      readonly FileDescriptor: unique symbol;
    },
    number
  > {}
export const FileDescriptor = Newtype<FileDescriptorN>();

function unitErrorCallback(cb: (_: IO<never, ErrnoException, void>) => void): (err: ErrnoException | null) => void {
  return (err) => (err ? cb(IO.fail(err)) : cb(IO.unit));
}

export function access(path: fs.PathLike, mode: number | undefined): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.access(path, mode, (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

export function appendFile(
  path: fs.PathLike | FileDescriptor,
  data: string | Buffer,
  options?: fs.WriteFileOptions,
): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.appendFile(path as any, data, options ?? {}, (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

export function chmod(path: fs.PathLike, mode: fs.Mode): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.chmod(path, mode, (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

export function close(fd: FileDescriptor): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.close(FileDescriptor.reverseGet(fd), (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

export function chown(path: fs.PathLike, uid: number, gid: number): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.chown(path, uid, gid, (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

export function copyFile(src: fs.PathLike, dest: fs.PathLike, flags: number): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.copyFile(src, dest, flags, (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

interface CreateReadStreamOptions {
  chunkSize?: number;
  flags?: fs.OpenMode;
  mode?: string | number;
  start?: number;
  end?: number;
}

export function createReadStream(
  path: fs.PathLike,
  options?: CreateReadStreamOptions,
): Stream<never, ErrnoException, Byte> {
  const chunkSize = options?.chunkSize ?? 1024 * 64;
  return Stream.acquireRelease(
    open(path, options?.flags ?? fs.constants.O_RDONLY, options?.mode).zipC(
      IO.defer(() => {
        const start = options?.start ?? 0;
        const end   = options?.end ?? Infinity;
        if (end < start) {
          return IO.fail(new RangeError(`start (${start}) must be <= end (${end})`));
        } else {
          return Ref.make([start, end] as const);
        }
      }),
    ),
    ([fd, _]) => close(fd).orHalt,
  ).flatMap(([fd, state]) =>
    Stream.repeatIOChunkMaybe(
      Do((Δ) => {
        const [pos, end]     = Δ(state.get);
        const n              = Math.min(end - pos + 1, chunkSize);
        const [bytes, chunk] = Δ(read(fd, n, pos).mapError(Maybe.just));

        Δ(IO.fail(Nothing()).when(() => bytes === 0));
        Δ(state.set([pos + n, end]));
        if (bytes !== chunk.length) {
          const dst = Buffer.allocUnsafeSlow(bytes);
          chunk.copy(dst, 0, 0, bytes);
          return Conc.fromBuffer(dst);
        } else {
          return Conc.fromBuffer(chunk);
        }
      }),
    ),
  );
}

interface CreateWriteSinkOptions {
  flags?: fs.OpenMode;
  mode?: string | number;
  start?: number;
}

export function createWriteSink<InErr>(
  path: fs.PathLike,
  options?: CreateWriteSinkOptions,
): Sink<never, InErr | ErrnoException, Byte, never, void> {
  return new Sink(
    Channel.unwrapScoped(
      Do((_) => {
        const errorRef = _(Ref.make<Maybe<ErrnoException>>(Nothing()));
        const st       = _(
          open(path, options?.flags ?? fs.constants.O_CREAT | fs.constants.O_WRONLY, options?.mode)
            .zipC(Ref.make(options?.start ?? undefined))
            .acquireRelease(([fd, _]) => close(fd).orHalt)
            .catchAll((err) => errorRef.set(Just(err))),
        );

        const maybeError = _(errorRef.get);
        if (!st && maybeError.isJust()) {
          const reader = Channel.readWith(
            (_: Conc<Byte>) => Channel.fail(maybeError.value) > Channel.end(undefined),
            (err: InErr) => Channel.failCause(Cause.then(Cause.fail(maybeError.value), Cause.fail(err))),
            (_: unknown) => Channel.fail(maybeError.value),
          );
          return reader;
        } else {
          const reader: Channel<
            never,
            InErr,
            Conc<Byte>,
            unknown,
            InErr | ErrnoException,
            Conc<never>,
            void
          > = Channel.readWith(
            (inp: Conc<Byte>) =>
              Channel.unwrap(
                st![1].get
                  .flatMap((pos) => write(st[0], inp, pos))
                  .flatMap(() => st![1].update((n) => (n !== undefined ? n + inp.length : undefined)))
                  .map(() => reader),
              ),
            (err) => Channel.fail(err),
            (_: unknown) => Channel.end(undefined),
          );
          return reader;
        }
      }),
    ),
  );
}

export function fchmod(fd: FileDescriptor, mode: fs.Mode): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.fchmod(FileDescriptor.reverseGet(fd), mode, unitErrorCallback(cb));
  });
}

export function fchown(fd: FileDescriptor, uid: number, gid: number): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.fchown(FileDescriptor.reverseGet(fd), uid, gid, unitErrorCallback(cb));
  });
}

export function fdatasync(fd: FileDescriptor): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.fdatasync(FileDescriptor.reverseGet(fd), unitErrorCallback(cb));
  });
}

export function fstat(fd: FileDescriptor): FIO<ErrnoException, fs.Stats> {
  return IO.async<never, ErrnoException, fs.Stats>((cb) => {
    fs.fstat(FileDescriptor.reverseGet(fd), (err, stats) => (err ? cb(IO.fail(err)) : cb(IO.succeedNow(stats))));
  });
}

export function fsync(fd: FileDescriptor): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.fsync(FileDescriptor.reverseGet(fd), unitErrorCallback(cb));
  });
}

export function ftruncate(fd: FileDescriptor, len: number): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.ftruncate(FileDescriptor.reverseGet(fd), len, unitErrorCallback(cb));
  });
}

export function futimes(
  fd: FileDescriptor,
  atime: string | number | Date,
  mtime: string | number | Date,
): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.futimes(FileDescriptor.reverseGet(fd), atime, mtime, unitErrorCallback(cb));
  });
}

export function lchmod(path: fs.PathLike, mode: fs.Mode): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.lchmod(path, mode, unitErrorCallback(cb));
  });
}

export function lchown(path: fs.PathLike, uid: number, gid: number): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.lchown(path, uid, gid, unitErrorCallback(cb));
  });
}

export function lutimes(
  path: fs.PathLike,
  atime: string | number | Date,
  mtime: string | number | Date,
): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.lutimes(path, atime, mtime, unitErrorCallback(cb));
  });
}

export function link(path: fs.PathLike, newPath: fs.PathLike): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.link(path, newPath, (err) => (err ? cb(IO.fail(err)) : cb(IO.unit)));
  });
}

export function lstat(path: fs.PathLike): FIO<ErrnoException, fs.Stats> {
  return IO.async<never, ErrnoException, fs.Stats>((cb) => {
    fs.lstat(path, (err, stats) => (err ? cb(IO.fail(err)) : cb(IO.succeedNow(stats))));
  });
}

export function mkdir(
  path: fs.PathLike,
  options?: { recursive?: boolean; mode?: fs.Mode },
): FIO<ErrnoException, Maybe<string>> {
  return IO.async<never, ErrnoException, Maybe<string>>((cb) => {
    fs.mkdir(path, options, (err, path) => (err ? cb(IO.fail(err)) : cb(IO.succeed(Maybe.fromNullable(path)))));
  });
}

export function mkdtemp(prefix: string, options?: { encoding?: BufferEncoding }): FIO<ErrnoException, string> {
  return IO.async<never, ErrnoException, string>((cb) => {
    fs.mkdtemp(prefix, options, (err, folder) => (err ? cb(IO.failNow(err)) : cb(IO.succeedNow(folder))));
  });
}

export function open(
  path: fs.PathLike,
  flags: fs.OpenMode,
  mode?: string | number,
): FIO<NodeJS.ErrnoException, FileDescriptor> {
  return IO.async<never, ErrnoException, FileDescriptor>((cb) => {
    fs.open(path, flags, mode ?? null, (err, fd) => (err ? cb(IO.fail(err)) : cb(IO.succeed(FileDescriptor.get(fd)))));
  });
}

export class Dir {
  readonly path: string;
  private readonly _dir: fs.Dir;
  constructor(dir: fs.Dir) {
    this.path = dir.path;
    this._dir = dir;
  }

  close(): FIO<ErrnoException, void> {
    return IO.async<never, ErrnoException, void>((cb) => {
      this._dir.close(unitErrorCallback(cb));
    });
  }

  read(): FIO<ErrnoException, Maybe<fs.Dirent>> {
    return IO.async<never, ErrnoException, Maybe<fs.Dirent>>((cb) => {
      this._dir.read((err, dirEnt) => (err ? cb(IO.fail(err)) : cb(IO.succeedNow(Maybe.fromNullable(dirEnt)))));
    });
  }
}

export function opendir(path: fs.PathLike, options?: fs.OpenDirOptions): FIO<ErrnoException, Dir> {
  return IO.async<never, ErrnoException, Dir>((cb) => {
    fs.opendir(path as any, options ?? {}, (err, dir) => (err ? cb(IO.fail(err)) : cb(IO.succeedNow(new Dir(dir)))));
  });
}

export function read(
  fd: FileDescriptor,
  length: number,
  position?: number,
): FIO<ErrnoException, readonly [number, Buffer]> {
  return IO.async<never, ErrnoException, readonly [number, Buffer]>((cb) => {
    const buf = Buffer.alloc(length);
    fs.read(FileDescriptor.reverseGet(fd), buf, 0, length, position ?? null, (err, bytesRead, buffer) =>
      err ? cb(IO.fail(err)) : cb(IO.succeed([bytesRead, buffer])),
    );
  });
}

export function readFile(
  file: fs.PathOrFileDescriptor,
  options: { flag?: string; encoding: BufferEncoding },
): FIO<ErrnoException, string>;
export function readFile(file: fs.PathOrFileDescriptor, options?: { flag?: string }): FIO<ErrnoException, Buffer>;
export function readFile(
  file: fs.PathOrFileDescriptor,
  options: { flag?: string; encoding?: BufferEncoding | null | undefined } = {},
): FIO<ErrnoException, string | Buffer> {
  return IO.asyncInterrupt((cb) => {
    const abortController = new AbortController();
    fs.readFile(file, { ...options, signal: abortController.signal }, (err, data) =>
      err ? cb(IO.fail(err)) : cb(IO.succeedNow(data)),
    );
    return Either.left(IO.succeed(abortController.abort()));
  });
}

export function readdir(
  path: fs.PathLike,
  options?: {
    encoding?: BufferEncoding;
    withFileTypes?: false;
  },
): FIO<ErrnoException, ReadonlyArray<string>>;
export function readdir(
  path: fs.PathLike,
  options: {
    encoding: "buffer";
    withFileTypes?: false;
  },
): FIO<ErrnoException, ReadonlyArray<Buffer>>;
export function readdir(
  path: fs.PathLike,
  options: {
    encoding?: BufferEncoding;
    withFileTypes: true;
  },
): FIO<ErrnoException, ReadonlyArray<Dir>>;
export function readdir(
  path: fs.PathLike,
  options?: {
    encoding?: BufferEncoding | "buffer";
    withFileTypes?: boolean;
  },
): FIO<ErrnoException, ReadonlyArray<any>> {
  return IO.async((cb) => {
    fs.readdir(path, options ?? ({} as any), (err, files: Array<any>) =>
      err ? cb(IO.fail(err)) : files[0] && files[0] instanceof fs.Dir ? files.map((a: fs.Dir) => new Dir(a)) : files,
    );
  });
}

export function realpath(
  path: fs.PathLike,
  options?: {
    encoding?: BufferEncoding;
  },
): FIO<ErrnoException, string>;
export function realpath(
  path: fs.PathLike,
  options: {
    encoding: "buffer";
  },
): FIO<ErrnoException, Buffer>;
export function realpath(path: fs.PathLike, options?: any): FIO<ErrnoException, any> {
  return IO.async<never, ErrnoException, any>((cb) => {
    fs.realpath(path, options ?? {}, (err, resolvedPath) => (err ? cb(IO.fail(err)) : cb(IO.succeedNow(resolvedPath))));
  });
}

export function realpathNative(
  path: fs.PathLike,
  options?: {
    encoding?: BufferEncoding;
  },
): FIO<ErrnoException, string>;
export function realpathNative(
  path: fs.PathLike,
  options: {
    encoding: "buffer";
  },
): FIO<ErrnoException, Buffer>;
export function realpathNative(path: fs.PathLike, options?: any): FIO<ErrnoException, any> {
  return IO.async<never, ErrnoException, any>((cb) => {
    fs.realpath.native(path, options ?? {}, (err, resolvedPath) =>
      err ? cb(IO.fail(err)) : cb(IO.succeed(resolvedPath)),
    );
  });
}

export function rename(oldPath: fs.PathLike, newPath: fs.PathLike): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.rename(oldPath, newPath, unitErrorCallback(cb));
  });
}

export function rm(path: fs.PathLike, options?: fs.RmOptions): FIO<ErrnoException, void> {
  return IO.async<never, NodeJS.ErrnoException, void>((cb) => {
    fs.rm(path, options ?? {}, unitErrorCallback(cb));
  });
}

export function rmdir(path: fs.PathLike, options?: fs.RmDirOptions): FIO<ErrnoException, void> {
  return IO.async<never, NodeJS.ErrnoException, void>((cb) => {
    fs.rmdir(path, options ?? {}, unitErrorCallback(cb));
  });
}

export function stat(path: fs.PathLike, options?: { bigint?: false }): FIO<ErrnoException, fs.Stats>;
export function stat(path: fs.PathLike, options: { bigint: true }): FIO<ErrnoException, fs.BigIntStats>;
export function stat(
  path: fs.PathLike,
  options?: { bigint?: boolean },
): FIO<ErrnoException, fs.Stats | fs.BigIntStats> {
  return IO.async<never, ErrnoException, fs.Stats | fs.BigIntStats>((cb) => {
    fs.stat(path, options ?? ({} as any), (err, stats) => (err ? cb(IO.fail(err)) : cb(IO.succeedNow(stats))));
  });
}

export function symlink(target: fs.PathLike, path: fs.PathLike): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.symlink(target, path, unitErrorCallback(cb));
  });
}

export function truncate(path: fs.PathLike, len?: number): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.truncate(path, len, unitErrorCallback(cb));
  });
}

export function unlink(path: fs.PathLike): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.unlink(path, unitErrorCallback(cb));
  });
}

export function utimes(
  path: fs.PathLike,
  atime: string | number | Date,
  mtime: string | number | Date,
): FIO<ErrnoException, void> {
  return IO.async<never, ErrnoException, void>((cb) => {
    fs.utimes(path, atime, mtime, unitErrorCallback(cb));
  });
}

export function write(fd: FileDescriptor, buffer: Conc<Byte>, position?: number): FIO<ErrnoException, number> {
  return IO.async<never, ErrnoException, number>((cb) => {
    const b = buffer.toBuffer;
    fs.write(FileDescriptor.reverseGet(fd), b, position ?? null, b.byteLength, (err, bytesWritten) =>
      err ? cb(IO.failNow(err)) : cb(IO.succeedNow(bytesWritten)),
    );
  });
}

export interface WriteFileOptions {
  readonly encoding?: BufferEncoding;
  readonly mode?: fs.Mode;
  readonly flag?: string;
}

export function writeFile(
  file: fs.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options: WriteFileOptions = {},
): IO<never, ErrnoException, void> {
  return IO.asyncInterrupt((cb) => {
    const abortController = new AbortController();
    fs.writeFile(file, data, { ...options, signal: abortController.signal }, (err) =>
      err ? cb(IO.fail(err)) : IO.unit,
    );
    return Either.left(IO.succeed(abortController.abort()));
  });
}

export function writev(
  fd: FileDescriptor,
  buffers: ReadonlyArray<Uint8Array>,
  position?: number,
): FIO<ErrnoException, number> {
  return IO.async<never, ErrnoException, number>((cb) => {
    if (position) {
      fs.writev(FileDescriptor.reverseGet(fd), buffers, position, (err, bytesWritten) =>
        err ? cb(IO.fail(err)) : cb(IO.succeedNow(bytesWritten)),
      );
    } else {
      fs.writev(FileDescriptor.reverseGet(fd), buffers, (err, bytesWritten) =>
        err ? cb(IO.fail(err)) : cb(IO.succeedNow(bytesWritten)),
      );
    }
  });
}

export function watch(
  filename: fs.PathLike,
  options: {
    persistent?: boolean;
    recursive?: boolean;
    encoding: "buffer";
  },
): Stream<never, Error, { eventType: "rename" | "change"; filename: Buffer }>;
export function watch(
  filename: fs.PathLike,
  options?: {
    persistent?: boolean;
    recursive?: boolean;
    encoding?: BufferEncoding;
  },
): Stream<never, Error, { eventType: "rename" | "change"; filename: string }>;
export function watch(
  filename: fs.PathLike,
  options?: any,
): Stream<never, Error, { eventType: "rename" | "change"; filename: string | Buffer }> {
  return Stream.fromIO(
    IO.tryCatch(
      () => fs.watch(filename, options ?? {}),
      (err) => err as Error,
    ),
  ).flatMap((watcher) =>
    Stream.repeatIOMaybe(
      IO.async<never, Maybe<Error>, { eventType: "rename" | "change"; filename: string | Buffer }>((cb) => {
        watcher.once("change", (eventType, filename) => {
          watcher.removeAllListeners();
          cb(IO.succeedNow({ eventType: eventType as any, filename }));
        });
        watcher.once("error", (error) => {
          watcher.removeAllListeners();
          cb(IO.failNow(Just(error)));
        });
        watcher.once("close", () => {
          watcher.removeAllListeners();
          cb(IO.failNow(Nothing()));
        });
      }),
    ),
  );
}

export function watchFile(
  filename: fs.PathLike,
  options: {
    bigint: true;
    persistent?: boolean;
    interval?: number;
  },
): Stream<never, never, [fs.BigIntStats, fs.BigIntStats]>;
export function watchFile(
  filename: fs.PathLike,
  options?: {
    bigint?: false;
    persistent?: boolean;
    interval?: number;
  },
): Stream<never, never, [fs.Stats, fs.Stats]>;
export function watchFile(
  filename: fs.PathLike,
  options?: any,
): Stream<never, never, [fs.BigIntStats | fs.Stats, fs.BigIntStats | fs.Stats]> {
  return Stream.acquireRelease(
    Do((_) => {
      const queue   = _(Queue.makeUnbounded<[fs.BigIntStats | fs.Stats, fs.BigIntStats | fs.Stats]>());
      const runtime = _(IO.runtime<never>());
      fs.watchFile(filename, options ?? {}, (curr, prev) => {
        runtime.unsafeRunAsync(queue.offer([curr, prev]));
      });
      return queue;
    }),
    (queue) => queue.shutdown,
  ).flatMap((queue) => Stream.repeatIOMaybe(queue.take));
}
