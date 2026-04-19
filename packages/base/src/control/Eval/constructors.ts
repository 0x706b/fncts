import { EvalPrimitive, EvalTag } from "@fncts/base/control/Eval/definition";

/**
 * Lift a strict value into `Eval`.
 *
 * @tsplus static fncts.control.EvalOps now
 */
export function now<A>(a: A): Eval<A> {
  const primitive = new EvalPrimitive(EvalTag.Value) as any;
  primitive.i0    = a;
  return primitive;
}

/**
 * Delay creation of a computation until evaluation.
 *
 * @tsplus static fncts.control.EvalOps defer
 */
export function defer<A>(make: Lazy<Eval<A>>): Eval<A> {
  const primitive = new EvalPrimitive(EvalTag.Defer) as any;
  primitive.i0    = make;
  return primitive;
}

/**
 * Recompute a lazy value each time it is evaluated.
 *
 * @tsplus static fncts.control.EvalOps always
 *
 * @tsplus static fncts.control.EvalOps __call
 */
export function always<A>(make: Lazy<A>): Eval<A> {
  return Eval.defer(Eval.now(make()));
}

/**
 * An `Eval` that produces `undefined`.
 *
 * @tsplus static fncts.control.EvalOps unit
 */
export const unit: Eval<void> = Eval.now(undefined);

const UNSET = Symbol.for("@tsplus/base/control/Eval/UNSET");

/**
 * Lazily compute a value once and memoize the result.
 *
 * @tsplus static fncts.control.EvalOps later
 */
export function later<A>(make: Lazy<A>): Eval<A> {
  let v: A | typeof UNSET = UNSET;
  // eslint-disable-next-line no-useless-assignment
  return Eval(v === UNSET ? (((v = make()), (make = null!)), v) : v);
}
