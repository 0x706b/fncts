import { AtomicSubject } from "@fncts/io/Subject/Atomic";

import { Subject } from "./definition.js";

/**
 * @tsplus static fncts.io.Push.SubjectOps unsafeMake
 */
export function unsafeMake<E, A>(): Subject<never, E, A> {
  return new AtomicSubject<E, A>();
}

/**
 * @tsplus static fncts.io.Push.SubjectOps make
 * @tsplus static fncts.io.Push.SubjectOps __call
 */
export function make<E, A>(): UIO<Subject<never, E, A>> {
  return IO(Subject.unsafeMake<E, A>());
}
