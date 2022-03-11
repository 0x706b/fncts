import type { Maybe } from "../../data/Maybe";
import type { Journal } from "../STM/internal/Journal";
import type { Atomic, TRef } from "../TRef/definition";

import { Either } from "../../data/Either";
import { Effect, STM } from "../STM/definition";
import { Entry } from "../STM/internal/Entry";
import { concrete } from "../TRef/definition";

function getOrMakeEntry<A>(self: Atomic<A>, journal: Journal): Entry {
  if (journal.has(self)) {
    return journal.get(self)!;
  }
  const entry = Entry.make(self, false);
  journal.set(self, entry);
  return entry;
}

/**
 * Retrieves the value of the `TRef`.
 *
 * @tsplus getter fncts.control.TRef get
 */
export function get<EA, EB, A, B>(self: TRef<EA, EB, A, B>): STM<unknown, EB, B> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry = getOrMakeEntry(self, journal);
        return entry.use((_) => _.unsafeGet<B>());
      });
    }
    case "Derived": {
      return self.use((getEither, _setEither, value, _atomic) =>
        get(value).chain((s) => getEither(s).match(STM.failNow, STM.succeedNow)),
      );
    }
    case "DerivedAll": {
      return self.use((getEither, _setEither, value, _atomic) =>
        get(value).chain((s) => getEither(s).match(STM.failNow, STM.succeedNow)),
      );
    }
  }
}

/**
 * Updates the value of the variable, returning a function of the specified
 * value.
 *
 * @tsplus fluent fncts.control.TRef modify
 */
export function modify_<E, A, B>(
  self: TRef<E, E, A, A>,
  f: (a: A) => readonly [B, A],
): STM<unknown, E, B> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry                = getOrMakeEntry(self, journal);
        const oldValue             = entry.use((_) => _.unsafeGet<A>());
        const [retValue, newValue] = f(oldValue);
        entry.use((_) => _.unsafeSet(newValue));
        return retValue;
      });
    }
    case "Derived": {
      return self.use((getEither, setEither, value, _atomic) =>
        modify_(value, (s) =>
          getEither(s).match(
            (e) => [Either.left<E, B>(e), s],
            (a1) => {
              const [b, a2] = f(a1);
              return setEither(a2).match(
                (e) => [Either.left(e), s],
                (s) => [Either.right(b), s],
              );
            },
          ),
        ),
      ).absolve;
    }
    case "DerivedAll": {
      return self.use((getEither, setEither, value, atomic) =>
        modify_(value, (s) =>
          getEither(s).match(
            (e) => [Either.left<E, B>(e), s],
            (a1) => {
              const [b, a2] = f(a1);
              return setEither(a2)(s).match(
                (e) => [Either.left(e), s],
                (s) => [Either.right(b), s],
              );
            },
          ),
        ),
      ).absolve;
    }
  }
}

/**
 * Sets the value of the `TRef`.
 *
 * @tsplus fluent fncts.control.TRef set
 */
export function set_<EA, EB, A, B>(self: TRef<EA, EB, A, B>, a: A): STM<unknown, EA, void> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry = getOrMakeEntry(self, journal);
        return entry.use((_) => _.unsafeSet(a));
      });
    }
    case "Derived": {
      return self.use((_getEither, setEither, value, _atomic) =>
        setEither(a).match(STM.failNow, (s) => set_(value, s)),
      );
    }
    case "DerivedAll": {
      return self.use((_getEither, setEither, value, _atomic) =>
        modify_(value, (s) =>
          setEither(a)(s).match(
            (e) => [Either.left(e), s] as [Either<EA, void>, typeof s],
            (s) => [Either.right(undefined), s],
          ),
        ),
      ).absolve;
    }
  }
}

/**
 * Unsafely retrieves the value of the `TRef`.
 *
 * @tsplus fluent fncts.control.TRef unsafeGet
 */
export function unsafeGet_<EA, EB, A, B>(self: TRef<EA, EB, A, B>, journal: Journal): A {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return getOrMakeEntry(self.atomic, journal).use((entry) => entry.unsafeGet<A>());
    default:
      return self
        .use((_getEither, _setEither, _value, atomic) => getOrMakeEntry(atomic, journal))
        .use((entry) => entry.unsafeGet());
  }
}

/**
 * Updates the value of the variable, returning a function of the specified
 * value.
 *
 * @tsplus fluent fncts.control.TRef modifyJust
 */
export function modifyJust_<E, A, B>(
  self: TRef<E, E, A, A>,
  b: B,
  f: (a: A) => Maybe<readonly [B, A]>,
): STM<unknown, E, B> {
  return self.modify((a) => f(a).getOrElse([b, a]));
}

/**
 * Sets the value of the `TRef` and returns the old value.
 *
 * @tsplus fluent fncts.control.TRef getAndSet
 */
export function getAndSet_<E, A>(self: TRef<E, E, A, A>, a: A): STM<unknown, E, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry    = getOrMakeEntry(self, journal);
        const oldValue = entry.use((entry) => entry.unsafeGet<A>());
        entry.use((entry) => entry.unsafeSet(a));
        return oldValue;
      });
    }
    default: {
      return modify_(self, (oldA) => [oldA, a]);
    }
  }
}

/**
 * Updates the value of the variable and returns the old value.
 *
 * @tsplus fluent fncts.control.TRef getAndUpdate
 */
export function getAndUpdate_<E, A>(self: TRef<E, E, A, A>, f: (a: A) => A): STM<unknown, E, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry    = getOrMakeEntry(self, journal);
        const oldValue = entry.use((_) => _.unsafeGet<A>());
        entry.use((_) => _.unsafeSet(f(oldValue)));
        return oldValue;
      });
    }
    default: {
      return modify_(self, (_) => [_, f(_)]);
    }
  }
}

/**
 * Updates some values of the variable but leaves others alone, returning the
 * old value.
 *
 * @tsplus fluent fncts.control.TRef getAndUpdateJust
 */
export function getAndUpdateJust_<E, A>(
  self: TRef<E, E, A, A>,
  f: (a: A) => Maybe<A>,
): STM<unknown, E, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry    = getOrMakeEntry(self, journal);
        const oldValue = entry.use((_) => _.unsafeGet<A>());
        const v        = f(oldValue);
        if (v.isJust()) {
          entry.use((_) => _.unsafeSet(v.value));
        }
        return oldValue;
      });
    }
    default: {
      return modify_(self, (a) =>
        f(a).match(
          () => [a, a],
          (v) => [a, v],
        ),
      );
    }
  }
}

/**
 * Updates the value of the variable.
 *
 * @tsplus fluent fncts.control.TRef update
 */
export function update_<E, A>(self: TRef<E, E, A, A>, f: (a: A) => A): STM<unknown, E, void> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry    = getOrMakeEntry(self, journal);
        const newValue = f(entry.use((_) => _.unsafeGet<A>()));
        entry.use((_) => _.unsafeSet(newValue));
      });
    }
    default:
      return modify_(self, (a) => [undefined, f(a)]);
  }
}

/**
 * Updates some values of the variable but leaves others alone.
 *
 * @tsplus fluent fncts.control.TRef updateJust
 */
export function updateJust_<E, A>(
  self: TRef<E, E, A, A>,
  f: (a: A) => Maybe<A>,
): STM<unknown, E, void> {
  return self.update((a) => f(a).getOrElse(a));
}

/**
 * Updates the value of the variable and returns the new value.
 *
 * @tsplus fluent fncts.control.TRef updateAndGet
 */
export function updateAndGet_<E, A>(self: TRef<E, E, A, A>, f: (a: A) => A): STM<unknown, E, A> {
  concrete(self);
  switch (self._tag) {
    case "Atomic": {
      return new Effect((journal) => {
        const entry    = getOrMakeEntry(self, journal);
        const oldValue = entry.use((e) => e.unsafeGet<A>());
        const newValue = f(oldValue);
        entry.use((e) => e.unsafeSet(newValue));
        return newValue;
      });
    }
    default: {
      return modify_(self, (a) => {
        const newValue = f(a);
        return [newValue, newValue];
      });
    }
  }
}

/**
 * Updates some values of the variable but leaves others alone.
 *
 * @tsplus fluent fncts.control.TRef updateJustAndGet
 */
export function updateJustAndGet_<E, A>(
  self: TRef<E, E, A, A>,
  f: (a: A) => Maybe<A>,
): STM<unknown, E, A> {
  return self.updateAndGet((a) => f(a).getOrElse(a));
}

/**
 * @tsplus fluent fncts.control.TRef unsafeSet
 */
export function unsafeSet_<EA, EB, A, B>(self: TRef<EA, EB, A, B>, journal: Journal, a: A): void {
  concrete(self);
  switch (self._tag) {
    case "Atomic":
      return getOrMakeEntry(self.atomic, journal).use((entry) => entry.unsafeSet(a));
    default:
      return self
        .use((_getEither, _setEither, _value, atomic) => getOrMakeEntry(atomic, journal))
        .use((entry) => entry.unsafeSet(a));
  }
}
