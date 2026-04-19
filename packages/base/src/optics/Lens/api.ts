import type { PLensPartiallyApplied } from "@fncts/base/optics/Lens/definition";
import type { Optional, POptional } from "@fncts/base/optics/Optional";
import type { AutoPath, Path } from "@fncts/typelevel/Object";

import { identity } from "@fncts/base/data/function";
import { Lens, PLens } from "@fncts/base/optics/Lens/definition";
import { Prism } from "@fncts/base/optics/Prism";

/**
 * Focuses a structure with the provided lens and exposes focused accessors.
 *
 * @tsplus fluent global focus
 */
export function focus<S, T, A, B>(self: S, lens: PLens<S, T, A, B>): PLensPartiallyApplied<T, A, B> {
  return {
    ...self.focus(lens as POptional<S, T, A, B>),
    get: () => lens.get(self),
  };
}

/**
 * Composes a lens with an array/tuple index lens.
 *
 * @tsplus pipeable fncts.optics.PLens component
 */
export function component<A extends ReadonlyArray<unknown>, P extends keyof A>(component: P) {
  return <S>(self: Lens<S, A>): Lens<S, A[P]> => {
    return self.compose(Lens.getComponent<A>()(component));
  };
}

/**
 * Builds a lens by composing this lens with another lens.
 *
 * @tsplus pipeable fncts.optics.PLens compose
 */
export function compose<A, B, C, D>(that: PLens<A, B, C, D>) {
  return <S, T>(self: PLens<S, T, A, B>): PLens<S, T, C, D> => {
    return PLens({
      get: self.get.compose(that.get),
      set: (d) => self.modify(that.set(d)),
    });
  };
}

/**
 * Narrows a lens target to non-nullable values through a nullable prism.
 *
 * @tsplus static fncts.optics.PLensOps fromNullable
 */
export function fromNullable<S, A>(self: Lens<S, A>): Optional<S, NonNullable<A>> {
  return self.compose(Prism.fromNullable<A>());
}

/**
 * Creates a lens focused on a specific array/tuple component.
 *
 * @tsplus static fncts.optics.PLensOps getComponent
 */
export function getComponent<A extends ReadonlyArray<unknown>>() {
  return <P extends keyof A>(component: P): Lens<A, A[P]> =>
    Lens({
      get: (s) => s[component],
      set: (ap) => (s) => {
        if (ap === s[component]) {
          return s;
        }
        const copy: A = s.slice() as unknown as A;
        copy[component] = ap;
        return copy;
      },
    });
}

/**
 * Creates a lens focused on a specific object property.
 *
 * @tsplus static fncts.optics.PLensOps getProp
 */
export function getProp<A extends Record<string, any>>() {
  return <P extends keyof A>(prop: P): Lens<A, A[P]> =>
    Lens({
      get: (s) => s[prop],
      set: (ap) => (s) => {
        if (ap === s[prop]) {
          return s;
        }
        return Object.assign({}, s, { [prop]: ap });
      },
    });
}

/**
 * Returns the identity lens that focuses the whole value.
 *
 * @tsplus static fncts.optics.PLensOps id
 */
export function id<A>(): Lens<A, A> {
  return PLens({
    get: identity,
    set: (t) => () => t,
  });
}

/**
 * Reinterprets the focused value using a pair of inverse mappings.
 *
 * @tsplus pipeable fncts.optics.PLensOps invmap
 */
export function invmap_<A, B>(f: (a: A) => B, g: (b: B) => A) {
  return <S>(self: Lens<S, A>): Lens<S, B> => {
    return Lens({
      get: self.get.compose(f),
      set: (b) => self.set(g(b)),
    });
  };
}

/**
 * Composes a lens with a property lens for the given key.
 *
 * @tsplus pipeable fncts.optics.Lens prop
 */
export function prop<A extends Record<string, any>, P extends keyof A>(prop: P) {
  return <S>(self: Lens<S, A>): Lens<S, A[P]> => {
    return self.compose(Lens.getProp<A>()(prop));
  };
}

/**
 * Builds nested object structure for setting a value at a path.
 */
function nestPath<A>(p: ReadonlyNonEmptyArray<string>, a: A): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let view = out;
  let last = "";
  for (let i = 0; i < p.length; i++) {
    const pi = p[i]!;
    view[pi] = {};
    if (!(i === p.length - 1)) {
      view = view[pi] as Record<string, unknown>;
    }
    last = pi;
  }
  view[last] = a;
  return out;
}

/**
 * Creates a path-based lens by walking and updating nested properties.
 */
function anyPath(path: ReadonlyArray<string>) {
  return (self: Lens<any, any>): Lens<any, any> => {
    return Lens({
      get: (s) =>
        path.foldLeft<string, Record<string, unknown>>(self.get(s), (b, p) => b[p] as Record<string, unknown>),
      set: (a) => (s) => {
        const os = self.get(s);
        const oa = path.foldLeft(os, (b, p) => b[p as string] as Record<string, unknown>);
        if (a === oa) {
          return s;
        }
        return s.pipe(self.set(Object.assign({}, os, path.isNonEmpty() ? nestPath(path, a) : a)));
      },
    });
  };
}

/**
 * Composes a lens with a nested path lens.
 *
 * @tsplus pipeable fncts.optics.Lens path
 */
export function path<A extends object, P extends Array<string>>(path: readonly [...AutoPath<A, P>]) {
  return <S>(self: Lens<S, A>): Lens<S, Path<A, P>> => {
    return anyPath(path)(self);
  };
}

/**
 * Creates a lens focused on a nested path from the root.
 *
 * @tsplus static fncts.optics.LensOps fromPath
 */
export function fromPath<S, P extends Array<string>>(path: readonly [...AutoPath<S, P>]): Lens<S, Path<S, P>> {
  return anyPath(path)(Lens.id());
}
