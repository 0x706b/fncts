/**
 * @tsplus static fncts.io.ConsoleOps show
 */
export function show(...data: unknown[]): UIO<void> {
  return IO.consoleWith((console) => console.show(...data));
}

/**
 * @tsplus static fncts.io.ConsoleOps print
 */
export function print(line: string): UIO<void> {
  return IO.consoleWith((console) => console.print(line));
}
