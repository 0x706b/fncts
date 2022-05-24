import { RoseTree } from "./definition.js";
/**
 * @tsplus static fncts.RoseTreeOps __call
 */
export function make<A>(value: A, forest: Vector<RoseTree<A>> = Vector.empty()): RoseTree<A> {
  return new RoseTree(value, forest);
}

/**
 * @tsplus fluent fncts.RoseTree foldLeft
 */
export function foldLeft<A, B>(self: RoseTree<A>, b: B, f: (b: B, a: A) => B): B {
  return foldLeftLoop(f, b, Vector(self), Vector());
}

/**
 * @tsplus fluent fncts.RoseTree foldRight
 */
export function foldRight<A, B>(self: RoseTree<A>, b: B, f: (a: A, b: B) => B): B {
  return self.foldLeft(Vector<A>(), (b, a) => b.prepend(a)).foldLeft(b, (b, a) => f(a, b));
}

/**
 * @tsplus tailRec
 */
function foldLeftLoop<A, B>(
  f: (b: B, a: A) => B,
  b: B,
  trees: Vector<RoseTree<A>>,
  nextSets: Vector<Vector<RoseTree<A>>>,
): B {
  if (trees.isEmpty()) {
    if (nextSets.isEmpty()) {
      return b;
    } else {
      return foldLeftLoop(f, b, nextSets.unsafeHead!, nextSets.tail);
    }
  } else {
    const tree = trees.unsafeHead!;
    if (tree.forest.isEmpty()) {
      return foldLeftLoop(f, f(b, tree.value), trees.tail, nextSets);
    } else {
      return foldLeftLoop(f, f(b, tree.value), tree.forest, trees.tail + nextSets);
    }
  }
}

/**
 * @tsplus fluent fncts.RoseTree map
 */
export function map<A, B>(self: RoseTree<A>, f: (a: A) => B): RoseTree<B> {
  return self.mapAccum(undefined, (_, a) => [undefined, f(a)])[1];
}

/**
 * @tsplus fluent fncts.RoseTree mapAccum
 */
export function mapAccum<A, S, B>(
  self: RoseTree<A>,
  s: S,
  f: (s: S, a: A) => readonly [S, B],
): readonly [S, RoseTree<B>] {
  const [state, b] = f(s, self.value);
  return mapAccumLoop(f, state, { todo: self.forest, done: Vector(), label: b }, List());
}

/**
 * @tsplus fluent fncts.RoseTree mapWithIndex
 */
export function mapWithIndex<A, B>(self: RoseTree<A>, f: (i: number, a: A) => B): RoseTree<B> {
  return self.mapAccum(0, (idx, elem) => [idx + 1, f(idx, elem)])[1];
}

interface MapAcc<A, B> {
  readonly todo: Vector<RoseTree<A>>;
  readonly done: Vector<RoseTree<B>>;
  readonly label: B;
}

/**
 * @tsplus tailRec
 */
function mapAccumLoop<S, A, B>(
  f: (s: S, a: A) => readonly [S, B],
  state: S,
  acc: MapAcc<A, B>,
  stack: List<MapAcc<A, B>>,
): readonly [S, RoseTree<B>] {
  if (acc.todo.isEmpty()) {
    const node = RoseTree(acc.label, acc.done.reverse);
    if (stack.isEmpty()) {
      return [state, node];
    }
    const top = stack.head;
    return mapAccumLoop(f, state, { label: top.label, todo: top.todo, done: node + top.done }, stack.tail);
  } else {
    const head             = acc.todo.unsafeHead!;
    const [state_, label_] = f(state, head.value);
    if (head.forest.isEmpty()) {
      return mapAccumLoop(
        f,
        state_,
        { label: acc.label, todo: acc.todo.tail, done: RoseTree(label_, Vector()) + acc.done },
        stack,
      );
    }
    return mapAccumLoop(
      f,
      state_,
      { label: label_, todo: head.forest, done: Vector() },
      Cons({ label: acc.label, done: acc.done, todo: acc.todo.tail }, stack),
    );
  }
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

/**
 * @tsplus fluent fncts.RoseTree zipWith
 */
export function zipWith<A, B, C>(self: RoseTree<A>, that: RoseTree<B>, f: (a: A, b: B) => C): RoseTree<C> {
  return self.zipWithAccum(that, undefined, (s, a, b) => [s, f(a, b)])[1];
}

/**
 * @tsplus fluent fncts.RoseTree zipWithAccum
 */
export function zipWithAccum<A, S, B, C>(
  self: RoseTree<A>,
  that: RoseTree<B>,
  s: S,
  f: (s: S, a: A, b: B) => readonly [S, C],
): readonly [S, RoseTree<C>] {
  const [state, c] = f(s, self.value, that.value);
  return zipWithAccumLoop(f, state, { todoL: self.forest, todoR: that.forest, done: Vector(), label: c }, List());
}

export interface ZipWithAcc<A, B, C> {
  readonly todoL: Vector<RoseTree<A>>;
  readonly todoR: Vector<RoseTree<B>>;
  readonly done: Vector<RoseTree<C>>;
  readonly label: C;
}

/**
 * @tsplus tailRec
 */
export function zipWithAccumLoop<S, A, B, C>(
  f: (s: S, a: A, b: B) => readonly [S, C],
  state: S,
  acc: ZipWithAcc<A, B, C>,
  stack: List<ZipWithAcc<A, B, C>>,
): readonly [S, RoseTree<C>] {
  if (acc.todoL.isEmpty()) {
    const node = RoseTree(acc.label, acc.done.reverse);
    if (stack.isEmpty()) {
      return [state, node];
    } else {
      const top = stack.unsafeHead!;
      return zipWithAccumLoop(
        f,
        state,
        { todoL: top.todoL, todoR: top.todoR, label: top.label, done: node + top.done },
        stack.tail,
      );
    }
  }
  if (acc.todoR.isEmpty()) {
    const node = RoseTree(acc.label, acc.done.reverse);
    if (stack.isEmpty()) {
      return [state, node];
    } else {
      const top = stack.unsafeHead!;
      return zipWithAccumLoop(
        f,
        state,
        { todoL: top.todoL, todoR: top.todoR, label: top.label, done: node + top.done },
        stack.tail,
      );
    }
  }
  const treeA            = acc.todoL.unsafeHead!;
  const treeB            = acc.todoR.unsafeHead!;
  const a                = treeA.value;
  const b                = treeB.value;
  const [state_, label_] = f(state, a, b);
  return zipWithAccumLoop(
    f,
    state_,
    { todoL: treeA.forest, todoR: treeB.forest, done: Vector(), label: label_ },
    Cons({ todoL: acc.todoL.tail, todoR: acc.todoR.tail, label: acc.label, done: acc.done }, stack),
  );
}

/**
 * @tsplus getter fncts.RoseTree draw
 */
export function draw(tree: RoseTree<string>): string {
  return tree.value + drawLoop(Vector("\n"), { todo: tree.forest, len: tree.forest.length, done: Vector() }, List());
}

interface DrawAcc {
  len: number;
  todo: Vector<RoseTree<string>>;
  done: Vector<string>;
}

/**
 * @tsplus tailRec
 */
function drawLoop(indentation: Vector<string>, acc: DrawAcc, stack: List<DrawAcc>): string {
  if (acc.todo.isEmpty()) {
    if (stack.isEmpty()) {
      return acc.done.reverse.join("");
    }
    const top = stack.head;
    return drawLoop(indentation.pop, { len: top.len, todo: top.todo, done: acc.done + top.done }, stack.tail);
  } else {
    const tree   = acc.todo.unsafeHead!;
    const rest   = acc.todo.tail;
    const isLast = rest.length === 0;
    return drawLoop(
      indentation + (acc.len > 1 && !isLast ? "│  " : "   "),
      {
        len: tree.forest.length,
        todo: tree.forest,
        done: Vector(indentation.join("") + (isLast ? "└" : "├") + "─ " + tree.value),
      },
      Cons({ len: acc.len, todo: rest, done: acc.done }, stack),
    );
  }
}
