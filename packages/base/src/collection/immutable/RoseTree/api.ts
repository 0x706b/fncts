import { RoseTree } from "./definition.js";

/**
 * @tsplus static fncts.RoseTreeOps __call
 */
export function make<A>(value: A, forest: Vector<RoseTree<A>> = Vector.empty()): RoseTree<A> {
  return new RoseTree(value, forest);
}

/**
 * @tsplus static fncts.RoseTreeOps unfold
 */
export function unfold<A, B>(b: B, f: (b: B) => readonly [A, Vector<B>]): RoseTree<A> {
  const [label, todo] = f(b);
  return unfoldLoop(f, { todo, label, done: Vector() }, Nil());
}

interface UnfoldAcc<A, B> {
  readonly todo: Vector<B>;
  readonly done: Vector<RoseTree<A>>;
  readonly label: A;
}

/**
 * @tsplus tailRec
 */
function unfoldLoop<A, B>(
  f: (b: B) => readonly [A, Vector<B>],
  acc: UnfoldAcc<A, B>,
  stack: List<UnfoldAcc<A, B>>,
): RoseTree<A> {
  if (acc.todo.isEmpty()) {
    const node = RoseTree(acc.label, acc.done.reverse);
    if (stack.isEmpty()) {
      return node;
    }
    const top = stack.head;
    return unfoldLoop(f, { label: top.label, todo: top.todo, done: node + top.done }, stack.tail);
  } else {
    const [label, todo] = f(acc.todo.unsafeHead!);
    if (todo.isEmpty()) {
      return unfoldLoop(f, { label: acc.label, todo: acc.todo.tail, done: RoseTree(label) + acc.done }, stack);
    }
    return unfoldLoop(
      f,
      { todo, label, done: Vector() },
      Cons({ done: acc.done, label: acc.label, todo: acc.todo.tail }, stack),
    );
  }
}
