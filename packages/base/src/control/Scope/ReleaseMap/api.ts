import { Exited, ReleaseMap, Running } from "./definition.js";

/**
 * @tsplus fluent fncts.control.Scope.ReleaseMap addIfOpen
 */
export function addIfOpen_(releaseMap: ReleaseMap, finalizer: Finalizer): UIO<Maybe<number>> {
  return ReleaseMap.reverseGet(releaseMap).modify((s) => {
    switch (s._tag) {
      case "Exited":
        return [
          Finalizer.reverseGet(finalizer)(s.exit).map(() => Nothing()),
          new Exited(s.nextKey + 1, s.exit, s.update),
        ];
      case "Running":
        return [
          IO.succeedNow(Just(s.nextKey)),
          new Running(s.nextKey + 1, s.finalizers.set(s.nextKey, finalizer), s.update),
        ];
    }
  }).flatten;
}

/**
 * @tsplus fluent fncts.control.Scope.ReleaseMap release
 */
export function release_(
  releaseMap: ReleaseMap,
  key: number,
  exit: Exit<any, any>,
): IO<unknown, never, any> {
  return ReleaseMap.reverseGet(releaseMap).modify((s) => {
    switch (s._tag) {
      case "Exited": {
        return [IO.unit, s];
      }
      case "Running": {
        return [
          s.finalizers.get(key).match(
            () => IO.unit,
            (f) => Finalizer.reverseGet(s.update(f))(exit),
          ),
          new Running(s.nextKey, s.finalizers.remove(key), s.update),
        ];
      }
    }
  }).flatten;
}

/**
 * @tsplus fluent fncts.control.Scope.ReleaseMap add
 */
export function add_(releaseMap: ReleaseMap, finalizer: Finalizer): UIO<Finalizer> {
  return releaseMap.addIfOpen(finalizer).map((key) =>
    key.match(
      (): Finalizer => Finalizer.get(() => IO.unit),
      (k): Finalizer => Finalizer.get((e) => releaseMap.release(k, e)),
    ),
  );
}

/**
 * @tsplus fluent fncts.control.Scope.ReleaseMap replace
 */
export function replace_(
  releaseMap: ReleaseMap,
  key: number,
  finalizer: Finalizer,
): UIO<Maybe<Finalizer>> {
  return ReleaseMap.reverseGet(releaseMap).modify((s) => {
    switch (s._tag) {
      case "Exited":
        return [
          Finalizer.reverseGet(finalizer)(s.exit).map(() => Nothing()),
          new Exited(s.nextKey, s.exit, s.update),
        ];
      case "Running":
        return [
          IO.succeedNow(s.finalizers.get(key)),
          new Running(s.nextKey, s.finalizers.set(key, finalizer), s.update),
        ];
    }
  }).flatten;
}

/**
 * @tsplus fluent fncts.control.Scope.ReleaseMap updateAll
 */
export function updateAll_(releaseMap: ReleaseMap, f: (_: Finalizer) => Finalizer): UIO<void> {
  return ReleaseMap.reverseGet(releaseMap).update((s) => {
    switch (s._tag) {
      case "Exited":
        return new Exited(s.nextKey, s.exit, (fin) => s.update(f(fin)));
      case "Running":
        return new Running(s.nextKey, s.finalizers, (fin) => s.update(f(fin)));
    }
  });
}
