import type { Optional } from "@fncts/base/optics/Optional";
import type { AutoPath, Path } from "@fncts/typelevel/Object";

import { identity } from "@fncts/base/data/function";
import { Lens, PLens } from "@fncts/base/optics/Lens/definition";
import { Prism } from "@fncts/base/optics/Prism";

/**
 * @tsplus fluent fncts.optics.PLens component
 */
export function component_<S, A extends ReadonlyArray<unknown>, P extends keyof A>(
  self: Lens<S, A>,
  component: P,
): Lens<S, A[P]> {
  return self.compose(Lens.getComponent<A>()(component));
}

/**
 * @tsplus fluent fncts.optics.PLens compose
 */
export function compose_<S, T, A, B, C, D>(
  self: PLens<S, T, A, B>,
  that: PLens<A, B, C, D>,
): PLens<S, T, C, D> {
  return PLens({
    get: self.get.compose(that.get),
    set_: (s, d) => self.modify_(s, that.set(d)),
  });
}

/**
 * @tsplus static fncts.optics.PLensOps fromNullable
 */
export function fromNullable<S, A>(self: Lens<S, A>): Optional<S, NonNullable<A>> {
  return self.compose(Prism.fromNullable<A>());
}

/**
 * @tsplus static fncts.optics.PLensOps getComponent
 */
export function getComponent<A extends ReadonlyArray<unknown>>() {
  return <P extends keyof A>(component: P): Lens<A, A[P]> =>
    Lens({
      get: (s) => s[component],
      set_: (s, ap) => {
        if (ap === s[component]) {
          return s;
        }
        const copy: A   = s.slice() as unknown as A;
        copy[component] = ap;
        return copy;
      },
    });
}

/**
 * @tsplus static fncts.optics.PLensOps getProp
 */
export function getProp<A extends Record<string, any>>() {
  return <P extends keyof A>(prop: P): Lens<A, A[P]> =>
    Lens({
      get: (s) => s[prop],
      set_: (s, ap) => {
        if (ap === s[prop]) {
          return s;
        }
        return Object.assign({}, s, { [prop]: ap });
      },
    });
}

/**
 * @tsplus static fncts.optics.PLensOps id
 */
export function id<S, A = S>(): PLens<S, A, S, A> {
  return PLens({
    get: identity,
    set_: (_, t) => t,
  });
}

/**
 * @tsplus fluent fncts.optics.PLensOps invmap
 */
export function invmap_<S, A, B>(self: Lens<S, A>, f: (a: A) => B, g: (b: B) => A): Lens<S, B> {
  return Lens({
    get: self.get.compose(f),
    set_: (s, b) => self.set_(s, g(b)),
  });
}

/**
 * @tsplus fluent fncts.optics.Lens prop
 */
export function prop_<S, A extends Record<string, any>, P extends keyof A>(
  self: Lens<S, A>,
  prop: P,
): Lens<S, A[P]> {
  return self.compose(Lens.getProp<A>()(prop));
}

function nestPath<A>(p: ReadonlyNonEmptyArray<string>, a: A): {} {
  const out = {};
  let view  = out;
  let last  = "";

  for (let i = 0; i < p.length; i++) {
    const pi = p[i]!;
    view[pi] = {};
    if (!(i === p.length - 1)) {
      view = view[pi];
    }
    last = pi;
  }

  view[last] = a;
  return out;
}

/**
 * @tsplus fluent fncts.optics.Lens path
 */
export function path_<S, A, P extends Array<string>>(
  self: Lens<S, A>,
  path: readonly [...AutoPath<A, P>],
): Lens<S, Path<A, P>> {
  return Lens({
    get: (s) => path.foldLeft(self.get(s), (b, p) => b[p as string]) as Path<A, P>,
    set_: (s, a) => {
      const os = self.get(s);
      const oa = path.foldLeft(os, (b, p) => b[p as string]);
      if (a === oa) {
        return s;
      }
      return self.set_(s, Object.assign({}, os, path.isNonEmpty() ? nestPath(path, a) : a));
    },
  });
}
