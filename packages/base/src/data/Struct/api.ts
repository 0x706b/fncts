import { Struct } from "./definition.js";

/**
 * @tsplus fluent fncts.data.Struct map
 */
export function map_<A, B>(self: Struct<A>, f: (a: A[keyof A]) => B): Struct<Record<keyof A, B>> {
  const out  = {} as Record<keyof A, B>;
  const keys = Object.keys(self);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]! as keyof A;
    out[k]  = f(self.reverseGet[k]);
  }
  return Struct.get(out);
}

/**
 * @tsplus getter fncts.data.Struct reverseGet
 * @tsplus macro identity
 */
export function reverseGet<A>(self: Struct<A>): A {
  return Struct.reverseGet(self);
}
