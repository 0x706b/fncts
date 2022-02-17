/**
 * @tsplus type fncts.Stack
 */
export interface Stack<A> {
  readonly value: A;
  readonly previous?: Stack<A>;
}

/**
 * @tsplus type fncts.StackOps
 */
export interface StackOps {}

export const Stack: StackOps = {};

/**
 * @tsplus static fncts.StackOps make
 */
export function mkStack<A>(value: A, previous?: Stack<A>): Stack<A> {
  return { value, previous };
}
