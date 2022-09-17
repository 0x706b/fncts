import type { Reloadable } from "./definition.js";

/**
 * @tsplus static fncts.io.ReloadableOps get
 */
export function get<Service>(
  /** @tsplus auto */ tag: Tag<Reloadable<Service>>,
): IO<Reloadable<Service>, unknown, Service> {
  return IO.serviceWithIO((service) => service.get, tag);
}

/**
 * @tsplus static fncts.io.ReloadableOps reload
 */
export function reload<Service>(
  /** @tsplua auto */ tag: Tag<Reloadable<Service>>,
): IO<Reloadable<Service>, unknown, void> {
  return IO.serviceWithIO((service) => service.reload, tag);
}

/**
 * @tsplus static fncts.io.ReloadableOps reloadFork
 */
export function reloadFork<Service>(
  /** @tsplus auto */ tag: Tag<Reloadable<Service>>,
): IO<Reloadable<Service>, never, void> {
  return IO.serviceWithIO((service) => service.reloadFork, tag);
}
