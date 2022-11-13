/**
 * @tsplus pipeable fncts.io.IO delay
 */
export function delay(duration: Lazy<Duration>) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, A> => {
    return IO.sleep(duration) > self;
  };
}
