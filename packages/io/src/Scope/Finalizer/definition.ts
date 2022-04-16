interface FinalizerN extends HKT {
  readonly type: Finalizer;
}

/**
 * @tsplus type fncts.io.Managed.Finalizer
 */
export interface Finalizer
  extends Newtype<
    {
      readonly Finalizer: unique symbol;
    },
    (exit: Exit<any, any>) => IO<unknown, never, any>
  > {}

/**
 * @tsplus type fncts.io.Managed.FinalizerOps
 */
export interface FinalizerOps extends Newtype.Iso<FinalizerN> {}

export const Finalizer: FinalizerOps = Newtype<FinalizerN>();

/**
 * @tsplus static fncts.io.Managed.FinalizerOps noop
 */
export const noop: Finalizer = Finalizer.get(() => IO.unit);
