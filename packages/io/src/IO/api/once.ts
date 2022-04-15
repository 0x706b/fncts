/**
 * @tsplus getter fncts.control.IO once
 */
export function once<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): UIO<IO<R, E, void>> {
  return Ref.make(true).map((ref) => self.whenIO(ref.getAndSet(false)));
}
