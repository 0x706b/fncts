export interface AsyncInputProducer<Err, Elem, Done> {
  emit(el: Elem): UIO<unknown>;
  done(a: Done): UIO<unknown>;
  error(cause: Cause<Err>): UIO<unknown>;
  awaitRead: UIO<void>;
}
