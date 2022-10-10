/**
 * @tsplus type fncts.Stack
 * @tsplus companion fncts.StackOps
 */
export class Stack<A> {
  constructor(private node?: Node<A>) {}
  clone(): Stack<A> {
    return new Stack(this.node);
  }
  get hasNext(): boolean {
    return !!this.node;
  }
  get isEmpty(): boolean {
    return !this.hasNext;
  }
  peek(): A | undefined {
    if (this.node) {
      return this.node.value;
    }
  }
  pop(): A | undefined {
    if (this.node) {
      const value = this.node.value;
      this.node   = this.node.previous;
      return value;
    }
  }
  push(value: A): void {
    this.node = { value, previous: this.node };
  }
}

interface Node<A> {
  readonly value: A;
  readonly previous?: Node<A>;
}

/**
 * @tsplus static fncts.StackOps __call
 */
export function makeStack<A>(): Stack<A> {
  return new Stack();
}

/**
 * @tsplus static fncts.StackOps single
 */
export function single<A>(value: A): Stack<A> {
  return new Stack({ value });
}
