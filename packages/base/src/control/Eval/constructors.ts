import { EvalPrimitive, EvalTag } from "@fncts/base/control/Eval/definition";

/**
 * @tsplus static fncts.control.EvalOps now
 */
export function now<A>(a: A): Eval<A> {
  const primitive = new EvalPrimitive(EvalTag.Value) as any;
  primitive.i0    = a;
  return primitive;
}

/**
 * @tsplus static fncts.control.EvalOps defer
 */
export function defer<A>(make: Lazy<Eval<A>>): Eval<A> {
  const primitive = new EvalPrimitive(EvalTag.Defer) as any;
  primitive.i0    = make;
  return primitive;
}

/**
 * @tsplus static fncts.control.EvalOps always
 * @tsplus static fncts.control.EvalOps __call
 */
export function always<A>(make: Lazy<A>): Eval<A> {
  return Eval.defer(Eval.now(make()));
}

const UNSET = Symbol.for("@tsplus/base/control/Eval/UNSET");

/**
 * @tsplus static fncts.control.EvalOps later
 */
export function later<A>(make: Lazy<A>): Eval<A> {
  let v: A | typeof UNSET = UNSET;
  return Eval(v === UNSET ? (((v = make()), (make = null!)), v) : v);
}
