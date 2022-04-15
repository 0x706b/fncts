import type { Lazy } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.control.LazyValue
 * @tsplus companion fncts.control.LazyValueOps
 */
export class LazyValue<A> {
  constructor(private getValue: () => A) {}
  get value() {
    const computed = this.getValue();
    Object.defineProperty(this, "value", {
      value: computed,
    });
    this.getValue = null!;
    return computed;
  }
}

/**
 * @tsplus static fncts.control.LazyValueOps __call
 */
export function lazy<A>(get: Lazy<A>): LazyValue<A> {
  return new LazyValue(get);
}
