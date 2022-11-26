import { IterableWeakMap } from "@fncts/base/collection/weak/IterableWeakMap";

export const ReloadableVariance = Symbol.for("fncts.io.Reloadable");
export type ReloadableVariance = typeof ReloadableVariance;

/**
 * @tsplus type fncts.io.Reloadable
 * @tsplus companion fncts.io.ReloadableOps
 */
export class Reloadable<Service> {
  declare [ReloadableVariance]: {
    readonly _Service: (_: never) => Service;
  };
  constructor(readonly scopedRef: ScopedRef<Service>, readonly reload: IO<never, unknown, void>) {}

  get get(): UIO<Service> {
    return this.scopedRef.get;
  }

  get reloadFork(): UIO<void> {
    return this.reload.forkDaemon.asUnit;
  }
}

const tagMap: IterableWeakMap<Tag<any>, Tag<any>> = new IterableWeakMap();

/**
 * @tsplus derive fncts.Tag[fncts.io.Reloadable]<_> 10
 */
export function deriveTag<S>(
  ...[tag]: [S] extends [Reloadable<infer X>] ? [tag: Tag<X>] : [tag: Tag<S>]
): Tag<Reloadable<S>> {
  if (tagMap.has(tag)) {
    return tagMap.get(tag) as Tag<Reloadable<S>>;
  }
  const reloadableTag = Tag<Reloadable<S>>(`Reloadable(${tag.id})`);
  tagMap.set(tag, reloadableTag);
  return reloadableTag;
}
