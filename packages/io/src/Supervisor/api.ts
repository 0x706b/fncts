import { concrete, SupervisorTag, Zip } from "@fncts/io/Supervisor/definition";

/**
 * @tsplus pipeable fncts.io.Supervisor zip
 */
export function zip<B>(fb: Supervisor<B>) {
  return <A>(fa: Supervisor<A>): Supervisor<readonly [A, B]> => {
    return new Zip(fa, fb);
  };
}

/**
 * @tsplus getter fncts.io.Supervisor toSet
 */
export function toSet(self: Supervisor<any>): HashSet<Supervisor<any>> {
  concrete(self);
  if (self === Supervisor.none) return HashSet.makeDefault();
  else {
    switch (self._tag) {
      case SupervisorTag.Zip:
        return self.first.toSet.union(self.second.toSet);
      default:
        return HashSet.makeDefault<Supervisor<any>>().add(self);
    }
  }
}

/**
 * @tsplus pipeable fncts.io.Supervisor removeSupervisor
 */
export function removeSupervisor(that: Supervisor<any>) {
  return (self: Supervisor<any>): Supervisor<any> => {
    concrete(self);
    if (self === that) return Supervisor.none;
    else {
      switch (self._tag) {
        case SupervisorTag.Zip:
          return self.first.removeSupervisor(that).zip(self.second.removeSupervisor(that));
        default:
          return self;
      }
    }
  };
}
