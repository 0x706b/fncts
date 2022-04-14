import { Defer, Value } from "@fncts/base/control/Eval/definition";

/**
 * @tsplus static fncts.control.EvalOps now
 */
export function now<A>(a: A): Eval<A> {
  return new Value(a);
}

/**
 * @tsplus static fncts.control.EvalOps defer
 */
export function defer<A>(make: Lazy<Eval<A>>): Eval<A> {
  return new Defer(make);
}

/**
 * @tsplus static fncts.control.EvalOps always
 * @tsplus static fncts.control.EvalOps __call
 */
export function always<A>(make: Lazy<A>): Eval<A> {
  return Eval.defer(Eval.now(make()));
}

const UNSET = Symbol.for("@tsplus/base/control/Eval/UNSET");

export function later<A>(make: Lazy<A>): Eval<A> {
  let v: A | typeof UNSET = UNSET;
  return Eval(v === UNSET ? (((v = make()), (make = null!)), v) : v);
}
