import {
  arraySpliceIn,
  arraySpliceOut,
  arrayUpdate,
  fromBitmap,
  hashFragment,
  MAX_INDEX_NODE,
  MIN_ARRAY_NODE,
  SIZE,
  toBitmap,
} from "@fncts/base/collection/immutable/HashMap/internal";
import { identity } from "@fncts/base/data/function";
import * as P from "@fncts/base/typeclass";

/**
 * @tsplus type fncts.HashSet
 * @tsplus companion fncts.HashSetOps
 */
export class HashSet<A> implements Iterable<A>, P.Hashable, P.Equatable {
  constructor(
    /**
     * @internal
     */
    public _editable: boolean,
    /**
     * @internal
     */
    public _edit: number,
    /**
     * @internal
     */
    readonly config: P.HashEq<A>,
    /**
     * @internal
     */
    public _root: Node<A>,
    /**
     * @internal
     */
    public _size: number,
  ) {}

  get size(): number {
    return this._size;
  }

  [Symbol.iterator](): Iterator<A> {
    return new HashSetIterator(this, identity);
  }

  get [Symbol.hash](): number {
    return Hashable.iterator(this[Symbol.iterator]());
  }

  [Symbol.equals](other: unknown): boolean {
    return (
      other instanceof HashSet &&
      this._size === other._size &&
      (this as Iterable<A>).corresponds(other, P.Equatable.strictEquals)
    );
  }
}

class HashSetIterator<A, T> implements IterableIterator<T> {
  v: VisitResult<A, T> | undefined;

  constructor(readonly set: HashSet<A>, readonly f: (node: A) => T) {
    this.v = visitLazy(this.set._root, this.f, undefined);
  }

  next(): IteratorResult<T> {
    if (this.v === undefined) {
      return { done: true, value: undefined };
    }
    const v0 = this.v.value;
    this.v   = applyCont(this.v.cont);
    return { done: false, value: v0 };
  }

  [Symbol.iterator](): IterableIterator<T> {
    return new HashSetIterator(this.set, this.f);
  }
}

/*
 * -------------------------------------------------------------------------------------------------
 * internal
 * -------------------------------------------------------------------------------------------------
 */

interface SizeRef {
  value: number;
}

export function canEditNode<A>(edit: number, node: Node<A>): boolean {
  return isEmptyNode(node) ? false : edit === node.edit;
}

export type Node<A> = EmptyNode<A> | LeafNode<A> | CollisionNode<A> | IndexedNode<A> | ArrayNode<A>;

export class EmptyNode<A> {
  readonly _tag = "EmptyNode";

  modify(
    remove: boolean,
    edit: number,
    eq: (y: A) => (x: A) => boolean,
    shift: number,
    hash: number,
    value: A,
    size: SizeRef,
  ) {
    if (remove) return this;
    ++size.value;
    return new LeafNode(edit, hash, value);
  }
}

export const _EmptyNode = new EmptyNode<never>();

export function isEmptyNode<A>(n: Node<A>): n is EmptyNode<A> {
  return n === _EmptyNode;
}

export class LeafNode<A> {
  readonly _tag = "LeafNode";
  constructor(public edit: number, public hash: number, public value: A) {}

  modify(
    remove: boolean,
    edit: number,
    eq: (y: A) => (x: A) => boolean,
    shift: number,
    hash: number,
    value: A,
    size: SizeRef,
  ): Node<A> {
    if (eq(this.value)(value)) {
      if (remove) {
        --size.value;
        return _EmptyNode;
      }
      if (value === this.value) {
        return this;
      }
      if (canEditNode(edit, this)) {
        this.value = value;
        return this;
      }
      return new LeafNode(edit, hash, value);
    }
    if (remove) {
      return this;
    }
    ++size.value;
    return mergeLeaves(edit, shift, this.hash, this, hash, new LeafNode(edit, hash, value));
  }
}

export class CollisionNode<A> {
  readonly _tag = "CollisionNode";
  constructor(public edit: number, public hash: number, public children: Array<Node<A>>) {}
  modify(
    remove: boolean,
    edit: number,
    eq: (y: A) => (x: A) => boolean,
    shift: number,
    hash: number,
    value: A,
    size: SizeRef,
  ): Node<A> {
    if (hash === this.hash) {
      const canEdit = canEditNode(edit, this);
      const list    = updateCollisionList(remove, canEdit, edit, eq, this.hash, this.children, value, size);
      if (list === this.children) return this;
      return list.length > 1 ? new CollisionNode(edit, this.hash, list) : list[0]!;
    }
    if (remove) return this;
    ++size.value;
    return mergeLeaves(edit, shift, this.hash, this, hash, new LeafNode(edit, hash, value));
  }
}

function updateCollisionList<A>(
  remove: boolean,
  mutate: boolean,
  edit: number,
  eq: (y: A) => (x: A) => boolean,
  hash: number,
  list: Array<Node<A>>,
  value: A,
  size: SizeRef,
) {
  const len = list.length;
  for (let i = 0; i < len; ++i) {
    const child = list[i]!;
    if ("value" in child && eq(value)(child.value)) {
      if (remove) {
        --size.value;
        return arraySpliceOut(mutate, i, list);
      }
      return arrayUpdate(mutate, i, new LeafNode(edit, hash, value), list);
    }
  }

  if (remove) return list;
  ++size.value;
  return arrayUpdate(mutate, len, new LeafNode(edit, hash, value), list);
}

export function isLeaf<A>(node: Node<A>): node is EmptyNode<A> | LeafNode<A> | CollisionNode<A> {
  return isEmptyNode(node) || node._tag === "LeafNode" || node._tag === "CollisionNode";
}

export class IndexedNode<A> {
  readonly _tag = "IndexNode";
  constructor(public edit: number, public mask: number, public children: Array<Node<A>>) {}

  modify(
    remove: boolean,
    edit: number,
    eq: (y: A) => (x: A) => boolean,
    shift: number,
    hash: number,
    value: A,
    size: SizeRef,
  ): Node<A> {
    const mask     = this.mask;
    const children = this.children;
    const frag     = hashFragment(shift, hash);
    const bit      = toBitmap(frag);
    const indx     = fromBitmap(mask, bit);
    const exists   = mask & bit;
    const current  = exists ? children[indx]! : _EmptyNode;
    const child    = current.modify(remove, edit, eq, shift + SIZE, hash, value, size);

    if (current === child) return this;

    const canEdit = canEditNode(edit, this);
    let bitmap    = mask;
    let newChildren;
    if (exists && isEmptyNode(child)) {
      bitmap &= ~bit;
      if (!bitmap) return _EmptyNode;
      if (children.length <= 2 && isLeaf(children[indx ^ 1]!)) return children[indx ^ 1]!;
      newChildren = arraySpliceOut(canEdit, indx, children);
    } else if (!exists && !isEmptyNode(child)) {
      if (children.length >= MAX_INDEX_NODE) return expand(edit, frag, child, mask, children);
      bitmap     |= bit;
      newChildren = arraySpliceIn(canEdit, indx, child, children);
    } else {
      newChildren = arrayUpdate(canEdit, indx, child, children);
    }

    if (canEdit) {
      this.mask     = bitmap;
      this.children = newChildren;
      return this;
    }
    return new IndexedNode(edit, bitmap, newChildren);
  }
}

export class ArrayNode<A> {
  readonly _tag = "ArrayNode";
  constructor(public edit: number, public size: number, public children: Array<Node<A>>) {}
  modify(
    remove: boolean,
    edit: number,
    eq: (y: A) => (x: A) => boolean,
    shift: number,
    hash: number,
    value: A,
    size: SizeRef,
  ): Node<A> {
    let count      = this.size;
    const children = this.children;
    const frag     = hashFragment(shift, hash);
    const child    = children[frag]!;
    const newChild = (child || _EmptyNode).modify(remove, edit, eq, shift + SIZE, hash, value, size);

    if (child === newChild) return this;

    const canEdit = canEditNode(edit, this);
    let newChildren;
    if (isEmptyNode(child) && !isEmptyNode(newChild)) {
      // add
      ++count;
      newChildren = arrayUpdate(canEdit, frag, newChild, children);
    } else if (!isEmptyNode(child) && isEmptyNode(newChild)) {
      // remove
      --count;
      if (count <= MIN_ARRAY_NODE) {
        return pack(edit, count, frag, children);
      }
      newChildren = arrayUpdate(canEdit, frag, _EmptyNode, children);
    } else {
      newChildren = arrayUpdate(canEdit, frag, newChild, children);
    }

    if (canEdit) {
      this.size     = count;
      this.children = newChildren;
      return this;
    }
    return new ArrayNode(edit, count, newChildren);
  }
}

function pack<A>(edit: number, count: number, removed: number, elements: Array<Node<A>>) {
  const children = new Array<Node<A>>(count - 1);
  let g          = 0;
  let bitmap     = 0;
  for (let i = 0, len = elements.length; i < len; ++i) {
    if (i !== removed) {
      const elem = elements[i];
      if (elem && !isEmptyNode(elem)) {
        children[g++] = elem;
        bitmap       |= 1 << i;
      }
    }
  }
  return new IndexedNode(edit, bitmap, children);
}

function expand<A>(edit: number, frag: number, child: Node<A>, bitmap: number, subNodes: Array<Node<A>>) {
  const arr = [];
  let bit   = bitmap;
  let count = 0;
  for (let i = 0; bit; ++i) {
    if (bit & 1) arr[i] = subNodes[count++]!;
    bit >>>= 1;
  }
  arr[frag] = child;
  return new ArrayNode(edit, count + 1, arr);
}

function mergeLeaves<A>(edit: number, shift: number, h1: number, n1: Node<A>, h2: number, n2: Node<A>): Node<A> {
  if (h1 === h2) return new CollisionNode(edit, h1, [n2, n1]);
  const subH1 = hashFragment(shift, h1);
  const subH2 = hashFragment(shift, h2);
  return new IndexedNode(
    edit,
    toBitmap(subH1) | toBitmap(subH2),
    subH1 === subH2 ? [mergeLeaves(edit, shift + SIZE, h1, n1, h2, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1],
  );
}

type Cont<V, A> = [len: number, children: Array<Node<V>>, i: number, f: (node: V) => A, cont: Cont<V, A>] | undefined;

function applyCont<V, A>(cont: Cont<V, A>) {
  return cont ? visitLazyChildren(cont[0], cont[1], cont[2], cont[3], cont[4]) : undefined;
}

function visitLazyChildren<V, A>(
  len: number,
  children: Node<V>[],
  i: number,
  f: (node: V) => A,
  cont: Cont<V, A>,
): VisitResult<V, A> | undefined {
  while (i < len) {
    // eslint-disable-next-line no-param-reassign
    const child = children[i++];
    if (child && !isEmptyNode(child)) {
      return visitLazy(child, f, [len, children, i, f, cont]);
    }
  }
  return applyCont(cont);
}

interface VisitResult<V, A> {
  value: A;
  cont: Cont<V, A>;
}

/**
 * Visit each leaf lazily
 */
function visitLazy<V, A>(
  node: Node<V>,
  f: (node: V) => A,
  cont: Cont<V, A> = undefined,
): VisitResult<V, A> | undefined {
  switch (node._tag) {
    case "LeafNode": {
      return {
        value: f(node.value),
        cont,
      };
    }
    case "CollisionNode":
    case "ArrayNode":
    case "IndexNode": {
      const children = node.children;
      return visitLazyChildren(children.length, children, 0, f, cont);
    }
    default: {
      return applyCont(cont);
    }
  }
}
