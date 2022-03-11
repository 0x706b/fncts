import type { Cause } from "../../../data/Cause";
import type { UIO } from "../../IO";

/**
 * Consumer-side view of `SingleProducerAsyncInput` for variance purposes.
 */
export interface AsyncInputConsumer<Err, Elem, Done> {
  takeWith<A>(
    onError: (cause: Cause<Err>) => A,
    onElement: (element: Elem) => A,
    onDone: (done: Done) => A,
  ): UIO<A>;
}
