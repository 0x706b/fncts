import { identity } from "@fncts/base/data/function";

function makeWith<Value, Patch>(
  ref: Lazy<FiberRef.WithPatch<Value, Patch>>,
): IO<Scope, never, FiberRef.WithPatch<Value, Patch>> {
  return IO.acquireRelease(
    IO.succeed(ref).tap((ref) => ref.update(identity)),
    (ref) => ref.remove,
  );
}

/**
 * @tsplus static fncts.io.FiberRefOps make
 */
export function make<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (a: A, a1: A) => A = (_, a) => a,
): IO<Scope, never, FiberRef<A>> {
  return makeWith(FiberRef.unsafeMake(initial, fork, join));
}
