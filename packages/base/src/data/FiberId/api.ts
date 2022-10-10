import { Composite, isComposite, isNone } from "./definition.js";

/**
 * @tsplus pipeable fncts.FiberId combine
 */
export function combine(id1: FiberId) {
  return (id0: FiberId): FiberId => {
    if (isNone(id0)) {
      return id1;
    }
    if (isNone(id1)) {
      return id0;
    }
    if (isComposite(id0)) {
      if (isComposite(id1)) {
        return new Composite(id0.fiberIds.union(id1.fiberIds));
      } else {
        return new Composite(id0.fiberIds.add(id1));
      }
    }
    if (isComposite(id1)) {
      return new Composite(id1.fiberIds.add(id0));
    }
    return new Composite(HashSet.fromDefault(id0, id1));
  };
}

/**
 * @tsplus getter fncts.FiberId ids
 */
export function ids(self: FiberId): HashSet<number> {
  switch (self._tag) {
    case "None":
      return HashSet.makeDefault();
    case "Runtime":
      return HashSet.fromDefault(self.id);
    case "Composite":
      return self.fiberIds.map((id) => id.id);
  }
}

/**
 * @tsplus getter fncts.FiberId threadName
 */
export function threadName(self: FiberId): string {
  return `fncts-fiber-${self.ids.map((n) => n.toString()).join(",")}`;
}
