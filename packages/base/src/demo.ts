import { IO } from "./control/IO.js";
import { Left } from "./data/Either.js";

const list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

IO.foreachC(list, (n) =>
  IO.asyncInterrupt<unknown, Error, number>((k) => {
    const handle = setTimeout(() => {
      n === 8 ? k(IO.fail(new Error(`error: ${n}`))) : k(IO(n));
    }, 100);

    return Left(IO.succeed(clearTimeout(handle)));
  }),
).unsafeRunWith((exit) =>
  exit.match(
    (cause) => console.log(cause.prettyPrint),
    () => console.log("Success!"),
  ),
);

/*
 * IO(0)
 *   .chain((n) => IO(n + 1))
 *   .chain((n) => IO(n + 1))
 *   .chain((n) => IO(n + 1))
 *   .chain((n) => IO(n + 1))
 *   .chain((n) => IO(n + 1))
 *   .chain((n) => IO.fail(`error: ${n + 1}`))
 *   .unsafeRunWith((exit) => exit.match(
 *     (cause) => console.log(cause.prettyPrint),
 *     () => console.log("Success")
 *   ))
 */
