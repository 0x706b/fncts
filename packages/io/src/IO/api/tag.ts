import { v4 } from "uuid";

declare module "@fncts/base/data/Tag/definition" {
  export namespace Tag {
    export type Proxy<Self, Type> = {
      [k in keyof Type as Type[k] extends (...args: infer Args extends ReadonlyArray<any>) => infer Ret
        ? ((...args: Readonly<Args>) => Ret) extends Type[k]
          ? k
          : never
        : k]: Type[k] extends (...args: infer Args extends ReadonlyArray<any>) => IO<infer R, infer E, infer A>
        ? (...args: Readonly<Args>) => IO<Self | R, E, A>
        : Type[k] extends (...args: infer Args extends ReadonlyArray<any>) => Promise<infer A>
          ? (...args: Readonly<Args>) => IO<Self, unknown, A>
          : Type[k] extends (...args: infer Args extends ReadonlyArray<any>) => infer A
            ? (...args: Readonly<Args>) => IO<Self, never, A>
            : Type[k] extends IO<infer R, infer E, infer A>
              ? IO<Self | R, E, A>
              : IO<Self, never, Type[k]>;
    };
  }
}

const makeTagProxy = (TagClass: Tag<any, any>) => {
  const cache = new Map();
  return new Proxy(TagClass, {
    get(target, prop, reciever) {
      if (prop in target) {
        return Reflect.get(target, prop, reciever);
      }
      if (cache.has(prop)) {
        return cache.get(prop);
      }
      const fn = (...args: Array<any>) => {
        return IO.defer(target).andThen((s: any) => {
          if (typeof s[prop] === "function") {
            cache.set(prop, (...args: Array<any>) => IO.defer(target).andThen((s: any) => s[prop](...args)));
            return s[prop](...args);
          }
          cache.set(
            prop,
            IO.defer(target).andThen((s: any) => s[prop]),
          );
          return s[prop];
        });
      };
      const cn = IO.defer(target).andThen((s: any) => s[prop]);
      Object.assign(fn, cn);
      Object.setPrototypeOf(fn, Object.getPrototypeOf(cn));
      cache.set(prop, fn);
      return fn;
    },
  });
};

/**
 * @tsplus static fncts.io.IOOps Tag
 */
export function makeTag<Id, Value = Id>(
  /** @fncts id */ id: string = v4(),
): Tag.TagClass<Id, Value> & Tag.Proxy<Id, Value> {
  const tag = new Tag(id);
  function TagClass() {}
  Object.assign(TagClass, tag);
  Object.assign(TagClass.prototype, Tag.prototype);
  return makeTagProxy(TagClass as any) as any;
}
