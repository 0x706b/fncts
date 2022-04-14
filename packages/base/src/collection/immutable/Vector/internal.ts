/* eslint-disable prefer-const */
/* eslint-disable no-var */
import type { MutableVector, Vector } from "@fncts/base/collection/immutable/Vector/definition";

/*
 * -------------------------------------------------------------------------------------------------
 * Internal
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @internal
 */
export abstract class VectorIterator<A> implements Iterator<A> {
  stack: any[][] | undefined;
  indices: number[] | undefined;
  idx: number;
  prefixSize: number;
  middleSize: number;
  result: IteratorResult<A> = { done: false, value: undefined as any };
  constructor(protected l: Vector<A>, direction: 1 | -1) {
    this.idx        = direction === 1 ? -1 : l.length;
    this.prefixSize = getPrefixSize(l);
    this.middleSize = l.length - getSuffixSize(l);
    if (l.root !== undefined) {
      const depth     = getDepth(l);
      this.stack      = new Array(depth + 1);
      this.indices    = new Array(depth + 1);
      let currentNode = l.root.array;
      for (let i = depth; 0 <= i; --i) {
        this.stack[i]   = currentNode;
        const idx       = direction === 1 ? 0 : currentNode.length - 1;
        this.indices[i] = idx;
        currentNode     = currentNode[idx].array;
      }
      this.indices[0] -= direction;
    }
  }
  abstract next(): IteratorResult<A>;
}

/**
 * @internal
 */
export class ForwardVectorIterator<A> extends VectorIterator<A> {
  constructor(l: Vector<A>) {
    super(l, 1);
  }
  nextInTree(): void {
    for (var i = 0; ++this.indices![i] === this.stack![i]!.length; ++i) {
      this.indices![i] = 0;
    }
    for (; 0 < i; --i) {
      this.stack![i - 1] = this.stack![i]![this.indices![i]!].array;
    }
  }
  next(): IteratorResult<A> {
    let newVal;
    const idx = ++this.idx;
    if (idx < this.prefixSize) {
      newVal = this.l.prefix[this.prefixSize - idx - 1];
    } else if (idx < this.middleSize) {
      this.nextInTree();
      newVal = this.stack![0]![this.indices![0]!];
    } else if (idx < this.l.length) {
      newVal = this.l.suffix[idx - this.middleSize];
    } else {
      this.result.done = true;
    }
    this.result.value = newVal;
    return this.result;
  }
}

/**
 * @internal
 */
export class BackwardVectorIterator<A> extends VectorIterator<A> {
  constructor(l: Vector<A>) {
    super(l, -1);
  }
  prevInTree(): void {
    for (var i = 0; this.indices![i] === 0; ++i) {
      //
    }
    --this.indices![i];
    for (; 0 < i; --i) {
      const n              = this.stack![i]![this.indices![i]!].array;
      this.stack![i - 1]   = n;
      this.indices![i - 1] = n.length - 1;
    }
  }
  next(): IteratorResult<A> {
    let newVal;
    const idx = --this.idx;
    if (this.middleSize <= idx) {
      newVal = this.l.suffix[idx - this.middleSize];
    } else if (this.prefixSize <= idx) {
      this.prevInTree();
      newVal = this.stack![0]![this.indices![0]!];
    } else if (0 <= idx) {
      newVal = this.l.prefix[this.prefixSize - idx - 1];
    } else {
      this.result.done = true;
    }
    this.result.value = newVal;
    return this.result;
  }
}

/**
 * @internal
 */
const branchingFactor = 32;

/**
 * @internal
 */
export const branchBits = 5;

/**
 * @internal
 */
export const mask = 31;

/**
 * @internal
 */
type Sizes = number[] | undefined;

/** @internal */
export class Node {
  constructor(public sizes: Sizes, public array: any[]) {}
}

/**
 * @internal
 */
function elementEquals(a: any, b: any): boolean {
  return a === b;
}

/**
 * @internal
 */
function createPath(depth: number, value: any): any {
  let current = value;
  for (let i = 0; i < depth; ++i) {
    current = new Node(undefined, [current]);
  }
  return current;
}

// Array Helpers

/**
 * @internal
 */
export function copyArray(source: any[]): any[] {
  const array = [];
  for (let i = 0; i < source.length; ++i) {
    array[i] = source[i];
  }
  return array;
}

/**
 * @internal
 */
function pushElements<A>(source: A[], target: A[], offset: number, amount: number): void {
  for (let i = offset; i < offset + amount; ++i) {
    target.push(source[i]!);
  }
}

/**
 * @internal
 */
function copyIndices(
  source: any[],
  sourceStart: number,
  target: any[],
  targetStart: number,
  length: number,
): void {
  for (let i = 0; i < length; ++i) {
    target[targetStart + i] = source[sourceStart + i];
  }
}

/**
 * @internal
 */
function arrayPrepend<A>(value: A, array: A[]): A[] {
  const newLength = array.length + 1;
  const result    = new Array(newLength);
  result[0]       = value;
  for (let i = 1; i < newLength; ++i) {
    result[i] = array[i - 1];
  }
  return result;
}

/**
 * Create a reverse _copy_ of an array.
 * @internal
 */
export function reverseArray<A>(array: A[]): A[] {
  return array.slice().reverse();
}

/**
 * @internal
 */
function arrayFirst<A>(array: A[]): A {
  return array[0]!;
}

/**
 * @internal
 */
function arrayLast<A>(array: A[]): A {
  return array[array.length - 1]!;
}

const pathResult = { path: 0, index: 0, updatedOffset: 0 };
type PathResult = typeof pathResult;

/**
 * @internal
 */
function getPath(index: number, offset: number, depth: number, sizes: Sizes): PathResult {
  let i = index;
  if (sizes === undefined && offset !== 0) {
    pathResult.updatedOffset = 0;
    i = handleOffset(depth, offset, i);
  }
  let path = (i >> (depth * branchBits)) & mask;
  if (sizes !== undefined) {
    while (sizes[path]! <= i) {
      path++;
    }
    const traversed = path === 0 ? 0 : sizes[path - 1]!;
    i              -= traversed;
    pathResult.updatedOffset = offset;
  }
  pathResult.path  = path;
  pathResult.index = i;
  return pathResult;
}

/**
 * @internal
 */
export function updateNode(
  node: Node,
  depth: number,
  index: number,
  offset: number,
  value: any,
): Node {
  const { path, index: newIndex, updatedOffset } = getPath(index, offset, depth, node.sizes);

  const array = copyArray(node.array);
  array[path] =
    depth > 0 ? updateNode(array[path], depth - 1, newIndex, updatedOffset, value) : value;
  return new Node(node.sizes, array);
}

/**
 * @internal
 */
function cloneNode({ sizes, array }: Node): Node {
  return new Node(sizes === undefined ? undefined : copyArray(sizes), copyArray(array));
}

// This array should not be mutated. Thus a dummy element is placed in
// it. Thus the affix will not be owned and thus not mutated.

/**
 * @internal
 */
export const emptyAffix: any[] = [0];

// We store a bit field in Vector. From right to left, the first five
// bits are suffix length, the next five are prefix length and the
// rest is depth. The functions below are for working with the bits in
// a sane way.

/**
 * @internal
 */
const affixBits = 6;

/**
 * @internal
 */
const affixMask = 0b111111;

/**
 * @internal
 */
export function getSuffixSize(l: Vector<any>): number {
  return l.bits & affixMask;
}

/**
 * @internal
 */
export function getPrefixSize(l: Vector<any>): number {
  return (l.bits >> affixBits) & affixMask;
}

/**
 * @internal
 */
export function getDepth(l: Vector<any>): number {
  return l.bits >> (affixBits * 2);
}

/**
 * @internal
 */
export function setPrefix(size: number, bits: number): number {
  return (size << affixBits) | (bits & ~(affixMask << affixBits));
}

/**
 * @internal
 */
export function setSuffix(size: number, bits: number): number {
  return size | (bits & ~affixMask);
}

/**
 * @internal
 */
export function setDepth(depth: number, bits: number): number {
  return (depth << (affixBits * 2)) | (bits & (affixMask | (affixMask << affixBits)));
}

/**
 * @internal
 */
export function incrementPrefix(bits: number): number {
  return bits + (1 << affixBits);
}

/**
 * @internal
 */
export function incrementSuffix(bits: number): number {
  return bits + 1;
}

/**
 * @internal
 */
export function incrementDepth(bits: number): number {
  return bits + (1 << (affixBits * 2));
}

/**
 * @internal
 */
export function decrementDepth(bits: number): number {
  return bits - (1 << (affixBits * 2));
}

/**
 * Appends the value to the Vector by _mutating_ the Vector and its content.
 *
 * @tsplus fluent fncts.base.MutableVector push
 */
export function push<A>(l: MutableVector<A>, value: A): MutableVector<A> {
  const suffixSize = getSuffixSize(l);
  if (l.length === 0) {
    l.bits   = setPrefix(1, l.bits);
    l.prefix = [value];
  } else if (suffixSize < 32) {
    l.bits = incrementSuffix(l.bits);
    l.suffix.push(value);
  } else if (l.root === undefined) {
    l.root   = new Node(undefined, l.suffix);
    l.suffix = [value];
    l.bits   = setSuffix(1, l.bits);
  } else {
    const newNode = new Node(undefined, l.suffix);
    const index   = l.length - 1 - 32 + 1;
    let current   = l.root!;
    let depth     = getDepth(l);
    l.suffix      = [value];
    l.bits        = setSuffix(1, l.bits);
    if (index - 1 < branchingFactor ** (depth + 1)) {
      for (; depth >= 0; --depth) {
        const path = (index >> (depth * branchBits)) & mask;
        if (path < current.array.length) {
          current = current.array[path];
        } else {
          current.array.push(createPath(depth - 1, newNode));
          break;
        }
      }
    } else {
      l.bits = incrementDepth(l.bits);
      l.root = new Node(undefined, [l.root, createPath(depth, newNode)]);
    }
  }
  l.length++;
  return l;
}

/**
 * @internal
 */
export function nodeNthDense(node: Node, depth: number, index: number): any {
  let current = node;
  // eslint-disable-next-line no-param-reassign
  for (; depth >= 0; --depth) {
    current = current.array[(index >> (depth * branchBits)) & mask];
  }
  return current;
}

/**
 * @internal
 */
export function handleOffset(depth: number, offset: number, index: number): number {
  let i = index;
  i    += offset;
  // eslint-disable-next-line no-param-reassign
  for (; depth >= 0; --depth) {
    i = index - (offset & (mask << (depth * branchBits)));
    if (((index >> (depth * branchBits)) & mask) !== 0) {
      break;
    }
  }
  return i;
}

/**
 * @internal
 */
export function nodeNth(node: Node, depth: number, offset: number, index: number): any {
  let path;
  let current = node;
  let i       = index;
  let ofs     = offset;
  let dep     = depth;
  while (current.sizes !== undefined) {
    path = (i >> (dep * branchBits)) & mask;
    while (current.sizes[path]! <= i) {
      path++;
    }
    if (path !== 0) {
      i  -= current.sizes[path - 1]!;
      ofs = 0; // Offset is discarded if the left spine isn't traversed
    }
    dep--;
    current = current.array[path];
  }
  return nodeNthDense(current, dep, ofs === 0 ? i : handleOffset(dep, ofs, i));
}

/**
 * @internal
 */
export function setSizes(node: Node, height: number): Node {
  let sum         = 0;
  const sizeTable = [];
  for (let i = 0; i < node.array.length; ++i) {
    sum         += sizeOfSubtree(node.array[i], height - 1);
    sizeTable[i] = sum;
  }
  node.sizes = sizeTable;
  return node;
}

/**
 * Returns the number of elements stored in the node.
 *
 * @internal
 */
function sizeOfSubtree(node: Node, height: number): number {
  if (height !== 0) {
    if (node.sizes !== undefined) {
      return arrayLast(node.sizes);
    } else {
      // the node is leftwise dense so all all but the last child are full
      const lastSize = sizeOfSubtree(arrayLast(node.array), height - 1);
      return ((node.array.length - 1) << (height * branchBits)) + lastSize;
    }
  } else {
    return node.array.length;
  }
}

// prepend & append

/**
 * @internal
 */
export function affixPush<A>(a: A, array: A[], length: number): A[] {
  if (array.length === length) {
    array.push(a);
    return array;
  } else {
    const newArray: A[] = [];
    copyIndices(array, 0, newArray, 0, length);
    newArray.push(a);
    return newArray;
  }
}

/**
 * Traverses down the left edge of the tree and copies k nodes.
 * Returns the last copied node.
 *
 * @internal
 */
function copyLeft(l: MutableVector<any>, k: number): Node {
  let currentNode = cloneNode(l.root!); // copy root
  l.root          = currentNode; // install copy of root

  for (let i = 1; i < k; ++i) {
    const index = 0; // go left
    if (currentNode.sizes !== undefined) {
      for (let i = 0; i < currentNode.sizes.length; ++i) {
        currentNode.sizes[i] += 32;
      }
    }
    const newNode = cloneNode(currentNode.array[index]);
    // Install the copied node
    currentNode.array[index] = newNode;
    currentNode              = newNode;
  }
  return currentNode;
}

/**
 * Prepends an element to a node
 *
 * @internal
 */
function nodePrepend(value: any, size: number, node: Node): Node {
  const array = arrayPrepend(value, node.array);
  let sizes   = undefined;
  if (node.sizes !== undefined) {
    sizes    = new Array(node.sizes.length + 1);
    sizes[0] = size;
    for (let i = 0; i < node.sizes.length; ++i) {
      sizes[i + 1] = node.sizes[i]! + size;
    }
  }
  return new Node(sizes, array);
}

/**
 * Prepends a node to a tree. Either by shifting the nodes in the root
 * left or by increasing the height
 *
 * @internal
 */
function prependTopTree<A>(l: MutableVector<A>, depth: number, node: Node): number {
  let newOffset;
  if (l.root!.array.length < branchingFactor) {
    // There is space in the root, there is never a size table in this
    // case
    newOffset = 32 ** depth - 32;
    l.root    = new Node(undefined, arrayPrepend(createPath(depth - 1, node), l.root!.array));
  } else {
    // We need to create a new root
    l.bits      = incrementDepth(l.bits);
    const sizes = l.root!.sizes === undefined ? undefined : [32, arrayLast(l.root!.sizes!) + 32];
    newOffset   = depth === 0 ? 0 : 32 ** (depth + 1) - 32;
    l.root      = new Node(sizes, [createPath(depth, node), l.root]);
  }
  return newOffset;
}

/**
 * Takes a Vector and a node tail. It then prepends the node to the tree
 * of the Vector.
 *
 * @internal
 */
export function prependNodeToTree<A>(l: MutableVector<A>, array: A[]): Vector<A> {
  if (l.root === undefined) {
    if (getSuffixSize(l) === 0) {
      // ensure invariant 1
      l.bits   = setSuffix(array.length, l.bits);
      l.suffix = array;
    } else {
      l.root = new Node(undefined, array);
    }
    return l;
  } else {
    const node    = new Node(undefined, array);
    const depth   = getDepth(l);
    let newOffset = 0;
    if (l.root.sizes === undefined) {
      if (l.offset !== 0) {
        newOffset = l.offset - branchingFactor;
        l.root    = prependDense(l.root, depth, l.offset, node);
      } else {
        // in this case we can be sure that the is not room in the tree
        // for the new node
        newOffset = prependTopTree(l, depth, node);
      }
    } else {
      // represents how many nodes _with size-tables_ that we should copy.
      let copyableCount = 0;
      // go down while there is size tables
      let nodesTraversed = 0;
      let currentNode    = l.root;
      while (currentNode.sizes !== undefined && nodesTraversed < depth) {
        ++nodesTraversed;
        if (currentNode.array.length < 32) {
          // there is room if offset is > 0 or if the first node does not
          // contain as many nodes as it possibly can
          copyableCount = nodesTraversed;
        }
        currentNode = currentNode.array[0];
      }
      if (l.offset !== 0) {
        const copiedNode = copyLeft(l, nodesTraversed);
        for (let i = 0; i < copiedNode.sizes!.length; ++i) {
          copiedNode.sizes![i] += branchingFactor;
        }
        copiedNode.array[0] = prependDense(
          copiedNode.array[0],
          depth - nodesTraversed,
          l.offset,
          node,
        );
        l.offset = l.offset - branchingFactor;
        return l;
      } else {
        if (copyableCount === 0) {
          l.offset = prependTopTree(l, depth, node);
        } else {
          let parent: Node | undefined;
          let prependableNode: Node;
          // Copy the part of the path with size tables
          if (copyableCount > 1) {
            parent          = copyLeft(l, copyableCount - 1);
            prependableNode = parent.array[0];
          } else {
            parent          = undefined;
            prependableNode = l.root!;
          }
          const path = createPath(depth - copyableCount, node);
          // add offset
          l.offset        = 32 ** (depth - copyableCount + 1) - 32;
          const prepended = nodePrepend(path, 32, prependableNode);
          if (parent === undefined) {
            l.root = prepended;
          } else {
            parent.array[0] = prepended;
          }
        }
        return l;
      }
    }
    l.offset = newOffset;
    return l;
  }
}

/**
 * Prepends a node to a dense tree. The given `offset` is never zero.
 *
 * @internal
 */
function prependDense(node: Node, depth: number, offset: number, value: Node): Node {
  // We're indexing down `offset - 1`. At each step `path` is either 0 or -1.
  const curOffset = (offset >> (depth * branchBits)) & mask;
  const path      = (((offset - 1) >> (depth * branchBits)) & mask) - curOffset;
  if (path < 0) {
    return new Node(undefined, arrayPrepend(createPath(depth - 1, value), node.array));
  } else {
    const array = copyArray(node.array);
    array[0]    = prependDense(array[0], depth - 1, offset, value);
    return new Node(undefined, array);
  }
}

/**
 * Takes a RRB-tree and an affix. It then appends the node to the
 * tree.
 *
 * @internal
 */
export function appendNodeToTree<A>(l: MutableVector<A>, array: A[]): MutableVector<A> {
  if (l.root === undefined) {
    // The old Vector has no content in tree, all content is in affixes
    if (getPrefixSize(l) === 0) {
      l.bits   = setPrefix(array.length, l.bits);
      l.prefix = reverseArray(array);
    } else {
      l.root = new Node(undefined, array);
    }
    return l;
  }
  const depth      = getDepth(l);
  let index        = handleOffset(depth, l.offset, l.length - 1 - getPrefixSize(l));
  let nodesToCopy  = 0;
  let nodesVisited = 0;
  let shift        = depth * 5;
  let currentNode  = l.root;
  if (32 ** (depth + 1) < index) {
    shift        = 0; // there is no room
    nodesVisited = depth;
  }
  while (shift > 5) {
    let childIndex: number;
    if (currentNode.sizes === undefined) {
      // does not have size table
      childIndex = (index >> shift) & mask;
      index     &= ~(mask << shift); // wipe just used bits
    } else {
      childIndex = currentNode.array.length - 1;
      index     -= currentNode.sizes[childIndex - 1]!;
    }
    nodesVisited++;
    if (childIndex < mask) {
      // we are not going down the far right path, this implies that
      // there is still room in the current node
      nodesToCopy = nodesVisited;
    }
    currentNode = currentNode.array[childIndex];
    if (currentNode === undefined) {
      // This will only happened in a pvec subtree. The index does not
      // exist so we'll have to create a new path from here on.
      nodesToCopy = nodesVisited;
      shift       = 5; // Set shift to break out of the while-loop
    }
    shift -= 5;
  }

  if (shift !== 0) {
    nodesVisited++;
    if (currentNode.array.length < branchingFactor) {
      // there is room in the found node
      nodesToCopy = nodesVisited;
    }
  }

  const node = new Node(undefined, array);
  if (nodesToCopy === 0) {
    // there was no room in the found node
    const newPath = nodesVisited === 0 ? node : createPath(nodesVisited, node);
    const newRoot = new Node(undefined, [l.root, newPath]);
    l.root        = newRoot;
    l.bits        = incrementDepth(l.bits);
  } else {
    const copiedNode = copyFirstK(l, nodesToCopy, array.length);
    copiedNode.array.push(createPath(depth - nodesToCopy, node));
  }
  return l;
}

/**
 * Traverses down the right edge of the tree and copies k nodes.
 *
 * @internal
 */
function copyFirstK(newVector: MutableVector<any>, k: number, leafSize: number): Node {
  let currentNode = cloneNode(newVector.root!); // copy root
  newVector.root  = currentNode; // install root

  for (let i = 1; i < k; ++i) {
    const index = currentNode.array.length - 1;
    if (currentNode.sizes !== undefined) {
      currentNode.sizes[index] += leafSize;
    }
    const newNode = cloneNode(currentNode.array[index]);
    // Install the copied node
    currentNode.array[index] = newNode;
    currentNode              = newNode;
  }
  if (currentNode.sizes !== undefined) {
    currentNode.sizes.push(arrayLast(currentNode.sizes) + leafSize);
  }
  return currentNode;
}

const eMax = 2;

/**
 * @internal
 */
function createConcatPlan(array: Node[]): number[] | undefined {
  const sizes: Array<number> = [];
  let sum                    = 0;
  for (let i = 0; i < array.length; ++i) {
    sum     += array[i]!.array.length; // FIXME: maybe only access array once
    sizes[i] = array[i]!.array.length;
  }
  const optimalLength = Math.ceil(sum / branchingFactor);
  let n               = array.length;
  let i               = 0;
  if (optimalLength + eMax >= n) {
    return undefined; // no rebalancing needed
  }
  while (optimalLength + eMax < n) {
    while (sizes[i]! > branchingFactor - eMax / 2) {
      // Skip nodes that are already sufficiently balanced
      ++i;
    }
    // the node at this index is too short
    let remaining = sizes[i]!; // number of elements to re-distribute
    do {
      const size = Math.min(remaining + sizes[i + 1]!, branchingFactor);
      sizes[i]   = size;
      remaining  = remaining - (size - sizes[i + 1]!);
      ++i;
    } while (remaining > 0);
    // Shift nodes after
    for (let j = i; j <= n - 1; ++j) {
      sizes[j] = sizes[j + 1]!;
    }
    --i;
    --n;
  }
  sizes.length = n;
  return sizes;
}

/**
 * Combines the children of three nodes into an array. The last child
 * of `left` and the first child of `right is ignored as they've been
 * concatenated into `center`.
 *
 * @internal
 */
function concatNodeMerge(left: Node | undefined, center: Node, right: Node | undefined): Node[] {
  const array = [];
  if (left !== undefined) {
    for (let i = 0; i < left.array.length - 1; ++i) {
      array.push(left.array[i]);
    }
  }
  for (let i = 0; i < center.array.length; ++i) {
    array.push(center.array[i]);
  }
  if (right !== undefined) {
    for (let i = 1; i < right.array.length; ++i) {
      array.push(right.array[i]);
    }
  }
  return array;
}

/**
 * @internal
 */
function executeConcatPlan(merged: Node[], plan: number[], height: number): any[] {
  const result  = [];
  let sourceIdx = 0; // the current node we're copying from
  let offset    = 0; // elements in source already used
  for (let toMove of plan) {
    let source = merged[sourceIdx]!.array;
    if (toMove === source.length && offset === 0) {
      // source matches target exactly, reuse source
      result.push(merged[sourceIdx]);
      ++sourceIdx;
    } else {
      const node = new Node(undefined, []);
      while (toMove > 0) {
        const available   = source.length - offset;
        const itemsToCopy = Math.min(toMove, available);
        pushElements(source, node.array, offset, itemsToCopy);
        if (toMove >= available) {
          ++sourceIdx;
          source = merged[sourceIdx]!.array;
          offset = 0;
        } else {
          offset += itemsToCopy;
        }
        toMove -= itemsToCopy;
      }
      if (height > 1) {
        // Set sizes on children unless they are leaf nodes
        setSizes(node, height - 1);
      }
      result.push(node);
    }
  }
  return result;
}

/**
 * Takes three nodes and returns a new node with the content of the
 * three nodes. Note: The returned node does not have its size table
 * set correctly. The caller must do that.
 *
 * @internal
 */
function rebalance(
  left: Node | undefined,
  center: Node,
  right: Node | undefined,
  height: number,
  top: boolean,
): Node {
  const merged   = concatNodeMerge(left, center, right);
  const plan     = createConcatPlan(merged);
  const balanced = plan !== undefined ? executeConcatPlan(merged, plan, height) : merged;
  if (balanced.length <= branchingFactor) {
    if (top === true) {
      return new Node(undefined, balanced);
    } else {
      // Return a single node with extra height for balancing at next
      // level
      return new Node(undefined, [setSizes(new Node(undefined, balanced), height)]);
    }
  } else {
    return new Node(undefined, [
      setSizes(new Node(undefined, balanced.slice(0, branchingFactor)), height),
      setSizes(new Node(undefined, balanced.slice(branchingFactor)), height),
    ]);
  }
}

/**
 * @internal
 */
export function concatSubTree<A>(
  left: Node,
  lDepth: number,
  right: Node,
  rDepth: number,
  isTop: boolean,
): Node {
  if (lDepth > rDepth) {
    const c = concatSubTree(arrayLast(left.array), lDepth - 1, right, rDepth, false);
    return rebalance(left, c, undefined, lDepth, isTop);
  } else if (lDepth < rDepth) {
    const c = concatSubTree(left, lDepth, arrayFirst(right.array), rDepth - 1, false);
    return rebalance(undefined, c, right, rDepth, isTop);
  } else if (lDepth === 0) {
    return new Node(undefined, [left, right]);
  } else {
    const c = concatSubTree<A>(
      arrayLast(left.array),
      lDepth - 1,
      arrayFirst(right.array),
      rDepth - 1,
      false,
    );
    return rebalance(left, c, right, lDepth, isTop);
  }
}

/**
 * @internal
 */
export const concatBuffer = new Array(3);

/**
 * @internal
 */
export function concatAffixes<A>(left: Vector<A>, right: Vector<A>): number {
  // TODO: Try and find a neat way to reduce the LOC here
  let nr           = 0;
  let arrIdx       = 0;
  let i            = 0;
  let length       = getSuffixSize(left);
  concatBuffer[nr] = [];
  for (i = 0; i < length; ++i) {
    concatBuffer[nr][arrIdx++] = left.suffix[i];
  }
  length = getPrefixSize(right);
  for (i = 0; i < length; ++i) {
    if (arrIdx === 32) {
      arrIdx = 0;
      ++nr;
      concatBuffer[nr] = [];
    }
    concatBuffer[nr][arrIdx++] = right.prefix[length - 1 - i];
  }
  length = getSuffixSize(right);
  for (i = 0; i < length; ++i) {
    if (arrIdx === 32) {
      arrIdx = 0;
      ++nr;
      concatBuffer[nr] = [];
    }
    concatBuffer[nr][arrIdx++] = right.suffix[i];
  }
  return nr;
}

/**
 * @internal
 */
export function getHeight(node: Node): number {
  if (node.array[0] instanceof Node) {
    return 1 + getHeight(node.array[0]);
  } else {
    return 0;
  }
}

/**
 * @internal
 */
export let newAffix: any[];

// function getBitsForDepth(n: number, depth: number): number {
//   return n & ~(~0 << ((depth + 1) * branchBits));
// }

function sliceNode(
  node: Node,
  index: number,
  depth: number,
  pathLeft: number,
  pathRight: number,
  childLeft: Node | undefined,
  childRight: Node | undefined,
): Node {
  const array = node.array.slice(pathLeft, pathRight + 1);
  if (childLeft !== undefined) {
    array[0] = childLeft;
  }
  if (childRight !== undefined) {
    array[array.length - 1] = childRight;
  }
  let sizes = node.sizes;
  if (sizes !== undefined) {
    sizes             = sizes.slice(pathLeft, pathRight + 1);
    let slicedOffLeft = pathLeft !== 0 ? node.sizes![pathLeft - 1]! : 0;
    if (childLeft !== undefined) {
      // If the left child has been sliced into a new child we need to know
      // how many elements have been removed from the child.
      if (childLeft.sizes !== undefined) {
        // If the left child has a size table we can simply look at that.
        const oldChild: Node = node.array[pathLeft];
        slicedOffLeft       += arrayLast(oldChild.sizes!) - arrayLast(childLeft.sizes);
      } else {
        // If the left child does not have a size table we can
        // calculate how many elements have been removed from it by
        // looking at the index. Note that when we slice into a leaf
        // the leaf is moved up as a prefix. Thus slicing, for
        // instance, at index 20 will remove 32 elements from the
        // child. Similarly slicing at index 50 will remove 64
        // elements at slicing at 64 will remove 92 elements.
        slicedOffLeft += ((index - slicedOffLeft) & ~0b011111) + 32;
      }
    }
    for (let i = 0; i < sizes.length; ++i) {
      sizes[i] -= slicedOffLeft;
    }
    if (childRight !== undefined) {
      const slicedOffRight =
        sizeOfSubtree(node.array[pathRight], depth - 1) - sizeOfSubtree(childRight, depth - 1);
      sizes[sizes.length - 1] -= slicedOffRight;
    }
  }
  return new Node(sizes, array);
}

/**
 * @internal
 */
export let newOffset = 0;

export function sliceLeft(
  tree: Node,
  depth: number,
  index: number,
  offset: number,
  top: boolean,
): Node | undefined {
  let { index: newIndex, path, updatedOffset } = getPath(index, offset, depth, tree.sizes);
  if (depth === 0) {
    newAffix = tree.array.slice(path).reverse();
    // This leaf node is moved up as a suffix so there is nothing here
    // after slicing
    return undefined;
  } else {
    const child = sliceLeft(tree.array[path], depth - 1, newIndex, updatedOffset, false);
    if (child === undefined) {
      // There is nothing in the child after slicing so we don't include it
      ++path;
      if (path === tree.array.length) {
        return undefined;
      }
    }
    // If we've sliced something away and it's not a the root, update offset
    if (tree.sizes === undefined && top === false) {
      newOffset |= (32 - (tree.array.length - path)) << (depth * branchBits);
    }
    return sliceNode(tree, index, depth, path, tree.array.length - 1, child, undefined);
  }
}

/** Slice elements off of a tree from the right */
export function sliceRight(
  node: Node,
  depth: number,
  index: number,
  offset: number,
): Node | undefined {
  let { index: newIndex, path } = getPath(index, offset, depth, node.sizes);
  if (depth === 0) {
    newAffix = node.array.slice(0, path + 1);
    // this leaf node is moved up as a suffix so there is nothing here
    // after slicing
    return undefined;
  } else {
    // slice the child, note that we subtract 1 then the radix lookup
    // algorithm can find the last element that we want to include
    // and sliceRight will do a slice that is inclusive on the index.
    const child = sliceRight(node.array[path], depth - 1, newIndex, path === 0 ? offset : 0);
    if (child === undefined) {
      // there is nothing in the child after slicing so we don't include it
      --path;
      if (path === -1) {
        return undefined;
      }
    }
    // note that we add 1 to the path since we want the slice to be
    // inclusive on the end index. Only at the leaf level do we want
    // to do an exclusive slice.
    const array = node.array.slice(0, path + 1);
    if (child !== undefined) {
      array[array.length - 1] = child;
    }
    let sizes: Sizes | undefined = node.sizes;
    if (sizes !== undefined) {
      sizes = sizes.slice(0, path + 1);
      if (child !== undefined) {
        const slicedOff =
          sizeOfSubtree(node.array[path], depth - 1) - sizeOfSubtree(child, depth - 1);
        sizes[sizes.length - 1] -= slicedOff;
      }
    }
    return new Node(sizes, array);
  }
}

export function sliceTreeVector<A>(
  from: number,
  to: number,
  tree: Node,
  depth: number,
  offset: number,
  l: MutableVector<A>,
): Vector<A> {
  const sizes = tree.sizes;
  let { index: newFrom, path: pathLeft } = getPath(from, offset, depth, sizes);
  let { index: newTo, path: pathRight }  = getPath(to, offset, depth, sizes);
  if (depth === 0) {
    // we are slicing a piece off a leaf node
    l.prefix = emptyAffix;
    l.suffix = tree.array.slice(pathLeft, pathRight + 1);
    l.root   = undefined;
    l.bits   = setSuffix(pathRight - pathLeft + 1, 0);
    return l;
  } else if (pathLeft === pathRight) {
    // Both ends are located in the same subtree, this means that we
    // can reduce the height
    l.bits = decrementDepth(l.bits);
    return sliceTreeVector(
      newFrom,
      newTo,
      tree.array[pathLeft],
      depth - 1,
      pathLeft === 0 ? offset : 0,
      l,
    );
  } else {
    const childRight = sliceRight(tree.array[pathRight], depth - 1, newTo, 0);
    l.bits           = setSuffix(newAffix.length, l.bits);
    l.suffix         = newAffix;
    if (childRight === undefined) {
      --pathRight;
    }
    newOffset = 0;

    const childLeft = sliceLeft(
      tree.array[pathLeft],
      depth - 1,
      newFrom,
      pathLeft === 0 ? offset : 0,
      pathLeft === pathRight,
    );
    l.offset = newOffset;
    l.bits   = setPrefix(newAffix.length, l.bits);
    l.prefix = newAffix;

    if (childLeft === undefined) {
      ++pathLeft;
    }
    if (pathLeft >= pathRight) {
      if (pathLeft > pathRight) {
        // This only happens when `pathLeft` originally was equal to
        // `pathRight + 1` and `childLeft === childRight === undefined`.
        // In this case there is no tree left.
        l.bits = setDepth(0, l.bits);
        l.root = undefined;
      } else {
        // Height can be reduced
        l.bits        = decrementDepth(l.bits);
        const newRoot =
          childRight !== undefined
            ? childRight
            : childLeft !== undefined
            ? childLeft
            : tree.array[pathLeft];
        l.root = new Node(newRoot.sizes, newRoot.array); // Is this size handling good enough?
      }
    } else {
      l.root = sliceNode(tree, from, depth, pathLeft, pathRight, childLeft, childRight);
    }
    return l;
  }
}

/**
 * @internal
 */
export function zeroOffset(): void {
  newOffset = 0;
}

type FoldCb<Input, State> = (input: Input, state: State, index: number) => boolean;

function foldLeftArrayCb<A, B>(
  cb: FoldCb<A, B>,
  state: B,
  array: A[],
  from: number,
  to: number,
  offset: number,
): [boolean, number] {
  for (var i = from; i < to && cb(array[i]!, state, i + offset); ++i) {
    //
  }
  return [i === to, i + offset + 1];
}

function foldRightArrayCb<A, B>(
  cb: FoldCb<A, B>,
  state: B,
  array: A[],
  from: number,
  to: number,
  offset: number,
): [boolean, number] {
  // eslint-disable-next-line no-param-reassign
  for (var i = from - 1; to <= i && cb(array[i]!, state, offset); --i, offset--) {
    //
  }
  return [i === to - 1, offset];
}

function foldLeftNodeCb<A, B>(
  cb: FoldCb<A, B>,
  state: B,
  node: Node,
  depth: number,
  offset: number,
): [boolean, number] {
  const { array } = node;
  if (depth === 0) {
    return foldLeftArrayCb(cb, state, array, 0, array.length, offset);
  }
  const to = array.length;
  let j    = offset;
  let cont;
  for (let i = 0; i < to; ++i) {
    [cont, j] = foldLeftNodeCb(cb, state, array[i], depth - 1, j);
    if (!cont) {
      return [false, j];
    }
  }
  return [true, j];
}

/**
 * This function is a lot like a fold. But the reducer function is
 * supposed to mutate its state instead of returning it. Instead of
 * returning a new state it returns a boolean that tells wether or not
 * to continue the fold. `true` indicates that the folding should
 * continue.
 */
export function foldLeftCb<A, B>(cb: FoldCb<A, B>, state: B, l: Vector<A>): B {
  const prefixSize = getPrefixSize(l);
  let i            = prefixSize - 1;
  let cont         = true;
  [cont, i]        = foldRightArrayCb(cb, state, l.prefix, prefixSize, 0, i);
  if (!cont) {
    return state;
  }
  i = prefixSize;
  if (l.root !== undefined) {
    [cont, i] = foldLeftNodeCb(cb, state, l.root, getDepth(l), i);
    if (!cont) {
      return state;
    }
  }
  const suffixSize = getSuffixSize(l);
  foldLeftArrayCb(cb, state, l.suffix, 0, suffixSize, i);
  return state;
}

function foldRightNodeCb<A, B>(
  cb: FoldCb<A, B>,
  state: B,
  node: Node,
  depth: number,
  offset: number,
): [boolean, number] {
  const { array } = node;
  if (depth === 0) {
    return foldRightArrayCb(cb, state, array, array.length, 0, offset);
  }
  let j = offset;
  let cont;
  for (let i = array.length - 1; 0 <= i; --i) {
    [cont, j] = foldRightNodeCb(cb, state, array[i], depth - 1, j);
    if (!cont) {
      return [false, j];
    }
  }
  return [true, j];
}

export function foldRightCb<A, B>(cb: FoldCb<A, B>, state: B, l: Vector<A>): B {
  const suffixSize = getSuffixSize(l);
  const prefixSize = getPrefixSize(l);
  let i            = l.length - 1;
  let cont         = true;
  [cont, i]        = foldRightArrayCb(cb, state, l.suffix, suffixSize, 0, i);
  if (!cont) {
    return state;
  }
  if (l.root !== undefined) {
    [cont, i] = foldRightNodeCb(cb, state, l.root, getDepth(l), i);
    if (!cont) {
      return state;
    }
  }
  const prefix = l.prefix;
  foldLeftArrayCb(
    cb,
    state,
    l.prefix,
    prefix.length - prefixSize,
    prefix.length,
    prefix.length - 1,
  );
  return state;
}

export function foldLeftPrefix<A, B>(
  f: (i: number, b: B, a: A) => B,
  b: B,
  array: A[],
  length: number,
): [B, number] {
  let acc = b;
  let j   = 0;
  for (let i = length - 1; 0 <= i; --i, j++) {
    acc = f(j, acc, array[i]!);
  }
  return [acc, j];
}

export function foldLeftNode<A, B>(
  f: (i: number, b: B, a: A) => B,
  b: B,
  node: Node,
  depth: number,
  offset: number,
): [B, number] {
  const { array } = node;
  let acc         = b;
  let j           = offset;
  if (depth === 0) {
    return foldLeftSuffix(f, b, array, array.length, offset);
  }
  for (let i = 0; i < array.length; ++i) {
    [acc, j] = foldLeftNode(f, acc, array[i], depth - 1, j);
  }
  return [acc, j];
}

export function foldLeftSuffix<A, B>(
  f: (i: number, b: B, a: A) => B,
  b: B,
  array: A[],
  length: number,
  offset: number,
): [B, number] {
  let acc = b;
  let j   = offset;
  for (let i = 0; i < length; ++i, j++) {
    acc = f(j, acc, array[i]!);
  }
  return [acc, j];
}

export function foldRightPrefix<A, B>(
  f: (i: number, a: A, b: B) => B,
  b: B,
  array: A[],
  length: number,
  offset: number,
): [B, number] {
  let acc = b;
  let j   = offset;
  for (let i = 0; i < length; ++i, j--) {
    acc = f(j, array[i]!, acc);
  }
  return [acc, j];
}

export function foldRightNode<A, B>(
  f: (i: number, a: A, b: B) => B,
  b: B,
  node: Node,
  depth: number,
  offset: number,
): [B, number] {
  const { array } = node;
  let acc         = b;
  let j           = offset;
  if (depth === 0) {
    return foldRightSuffix(f, b, array, array.length, offset);
  }
  for (let i = array.length - 1; 0 <= i; --i) {
    [acc, j] = foldRightNode(f, acc, array[i], depth - 1, j);
  }
  return [acc, j];
}

export function foldRightSuffix<A, B>(
  f: (i: number, a: A, b: B) => B,
  b: B,
  array: A[],
  length: number,
  offset: number,
): [B, number] {
  let acc = b;
  let j   = offset;
  for (let i = length - 1; 0 <= i; --i, j--) {
    acc = f(j, array[i]!, acc);
  }
  return [acc, j];
}

function mapArray<A, B>(f: (i: number, a: A) => B, array: A[], offset: number): [B[], number] {
  const result = new Array(array.length);
  for (let i = 0; i < array.length; ++i) {
    result[i] = f(offset + i, array[i]!);
  }
  return [result, offset + array.length];
}

export function mapNode<A, B>(
  f: (i: number, a: A) => B,
  node: Node,
  depth: number,
  offset: number,
  adjust: number,
): [Node, number] {
  if (depth !== 0) {
    const { array } = node;
    let innerOffset = offset;
    const result    = new Array(array.length);
    for (let i = 0; i < array.length; ++i) {
      const [res, newOffset] = mapNode(f, array[i], depth - 1, innerOffset, adjust * 32);
      innerOffset            = newOffset;
      result[i]              = res;
    }
    return [new Node(node.sizes, result), innerOffset];
  } else {
    const [res, newOffset] = mapArray(f, node.array, offset);
    return [new Node(undefined, res), newOffset];
  }
}

export function mapPrefix<A, B>(f: (i: number, a: A) => B, prefix: A[], length: number): B[] {
  const newPrefix = new Array(length);
  for (let i = length - 1; 0 <= i; --i) {
    newPrefix[i] = f(length - 1 - i, prefix[i]!);
  }
  return newPrefix;
}

export function mapAffix<A, B>(
  f: (i: number, a: A) => B,
  suffix: A[],
  length: number,
  totalLength: number,
): B[] {
  const priorLength = totalLength - length;
  const newSuffix   = new Array(length);
  for (let i = 0; i < length; ++i) {
    newSuffix[i] = f(priorLength + i, suffix[i]!);
  }
  return newSuffix;
}

// functions based on foldlCb

export function arrayPush<A>(array: A[], a: A): A[] {
  array.push(a);
  return array;
}
