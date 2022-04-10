interface FinalizerN extends HKT {
  readonly type: Finalizer;
}

/**
 * @tsplus type fncts.control.Managed.Finalizer
 */
export interface Finalizer
  extends Newtype<
    {
      readonly Finalizer: unique symbol;
    },
    (exit: Exit<any, any>) => IO<unknown, never, any>
  > {}

/**
 * @tsplus type fncts.control.Managed.FinalizerOps
 */
export interface FinalizerOps extends Newtype.Iso<FinalizerN> {}

export const Finalizer: FinalizerOps = Newtype<FinalizerN>();

/**
 * @tsplus static fncts.control.Managed.FinalizerOps noop
 */
export const noop: Finalizer = Finalizer.get(() => IO.unit);
