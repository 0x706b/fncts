import type { RBNode } from "@fncts/base/collection/immutable/SortedMap/node";
import type { Ord } from "@fncts/base/typeclass";

import { fixDoubleBlack, swapNode } from "@fncts/base/collection/immutable/SortedMap/internal";
import { Color, Leaf, Node } from "@fncts/base/collection/immutable/SortedMap/node";

export interface SortedMapIterable<K, V> extends Iterable<readonly [K, V]> {
  readonly ord: Ord<K>;
  [Symbol.iterator](): SortedMapIterator<K, V>;
}

export function forward<K, V>(self: SortedMap<K, V>): SortedMapIterable<K, V> {
  return {
    ord: self.ord,
    [Symbol.iterator]() {
      const stack: Array<Node<K, V>> = [];
      let n = self.root;
      while (n) {
        stack.push(n);
        n = n.left;
      }
      return new SortedMapIterator(self, stack, 0);
    },
  };
}

export function backward<K, V>(self: SortedMap<K, V>): SortedMapIterable<K, V> {
  return {
    ord: self.ord,
    [Symbol.iterator]() {
      const stack: Array<Node<K, V>> = [];
      let n = self.root;
      while (n) {
        stack.push(n);
        n = n.right;
      }
      return new SortedMapIterator(self, stack, 1);
    },
  };
}

export class SortedMapIterator<K, V> implements Iterator<readonly [K, V]> {
  private count = 0;
  constructor(readonly m: SortedMap<K, V>, readonly stack: Array<Node<K, V>>, readonly direction: 0 | 1) {}

  next(): IteratorResult<readonly [K, V]> {
    if (this.isEmpty) {
      return { done: true, value: this.count };
    }
    this.count++;
    const value: readonly [K, V] = [this.stack[this.stack.length - 1]!.key, this.stack[this.stack.length - 1]!.value];
    switch (this.direction) {
      case 0: {
        this.moveNext();
        break;
      }
      case 1: {
        this.movePrev();
        break;
      }
    }
    return { done: false, value };
  }

  get isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Returns the current node
   */
  get node(): RBNode<K, V> {
    if (this.isEmpty) {
      return Leaf;
    }
    return this.stack[this.stack.length - 1]!;
  }

  /**
   * Returns the current key
   */
  get key(): Maybe<K> {
    if (this.isEmpty) {
      return Nothing();
    }
    return Just(this.node!.key);
  }

  /**
   * Returns the current value
   */
  get value(): Maybe<V> {
    if (this.isEmpty) {
      return Nothing();
    }
    return Just(this.node!.value);
  }

  /**
   * Returns the current entry
   */
  get entry(): Maybe<readonly [K, V]> {
    if (this.isEmpty) {
      return Nothing();
    }
    return Just([this.stack[this.stack.length - 1]!.key, this.stack[this.stack.length - 1]!.value]);
  }

  /**
   * Checks if the iterator has a next element
   */
  get hasNext(): boolean {
    const stack = this.stack;
    if (stack.length === 0) {
      return false;
    }
    if (stack[stack.length - 1]!.right) {
      return true;
    }
    for (let s = stack.length - 1; s > 0; --s) {
      if (stack[s - 1]!.left === stack[s]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Advances the iterator
   */
  moveNext(): void {
    if (this.isEmpty) {
      return;
    }
    const stack         = this.stack;
    let n: RBNode<K, V> = stack[stack.length - 1]!;
    if (n.right) {
      n = n.right;
      while (n) {
        stack.push(n);
        n = n.left;
      }
    } else {
      stack.pop();
      while (stack.length > 0 && stack[stack.length - 1]!.right === n) {
        n = stack[stack.length - 1]!;
        stack.pop();
      }
    }
  }

  /**
   * Checks if the iterator has a previous element
   */
  get hasPrev(): boolean {
    const stack = this.stack;
    if (stack.length === 0) {
      return false;
    }
    if (stack[stack.length - 1]!.left) {
      return true;
    }
    for (let s = stack.length - 1; s > 0; --s) {
      if (stack[s - 1]!.right === stack[s]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retreats the iterator to the previous element
   */
  movePrev(): void {
    const stack = this.stack;
    if (stack.length === 0) {
      return;
    }
    let n: RBNode<K, V> = stack[stack.length - 1]!;
    if (n.left) {
      n = n.left;
      while (n) {
        stack.push(n);
        n = n.right;
      }
    } else {
      stack.pop();
      while (stack.length > 0 && stack[stack.length - 1]!.left === n) {
        n = stack[stack.length - 1]!;
        stack.pop();
      }
    }
  }

  /**
   * Returns a `OrderedMapIterator` of the same tree, with a cloned stack
   */
  clone(): SortedMapIterator<K, V> {
    return new SortedMapIterator(this.m, this.stack.slice(), this.direction);
  }

  /**
   * Reverses the direction of the iterator
   */
  reverse(): SortedMapIterator<K, V> {
    return new SortedMapIterator(this.m, this.stack.slice(), this.direction ? 0 : 1);
  }

  /**
   * Deletes the current element, returing a new `OrderedMap`
   */
  remove(): SortedMap<K, V> {
    const pathStack = this.stack;
    if (pathStack.length === 0) {
      return this.m;
    }
    // clone path to node
    const stack: Array<Node<K, V>> = new Array(pathStack.length);
    let n: Node<K, V>              = pathStack[pathStack.length - 1]!;
    stack[stack.length - 1]        = new Node(n.color, n.left, n.key, n.value, n.right, n.count);
    for (let i = pathStack.length - 2; i >= 0; --i) {
      const n = pathStack[i]!;
      if (n.left === pathStack[i + 1]!) {
        stack[i] = new Node(n.color, stack[i + 1]!, n.key, n.value, n.right, n.count);
      } else {
        stack[i] = new Node(n.color, n.left, n.key, n.value, stack[i + 1]!, n.count);
      }
    }

    // get node
    n = stack[stack.length - 1]!;

    // if not leaf, then swap with previous node
    if (n.left && n.right) {
      // first walk to previous leaf
      const split = stack.length;
      n           = n.left;
      while (n.right) {
        stack.push(n);
        n = n.right;
      }
      // clone path to leaf
      const v = stack[split - 1]!;
      stack.push(new Node(n.color, n.left, v.key, v.value, n.right, n.count));
      stack[split - 1]!.key   = n.key;
      stack[split - 1]!.value = n.value;

      // fix stack
      for (let i = stack.length - 2; i >= split; --i) {
        n        = stack[i]!;
        stack[i] = new Node(n.color, n.left, n.key, n.value, stack[i + 1]!, n.count);
      }
      stack[split - 1]!.left = stack[split]!;
    }
    n = stack[stack.length - 1]!;
    if (n.color === Color.R) {
      // removing red leaf
      const p = stack[stack.length - 2]!;
      if (p.left === n) {
        p.left = null;
      } else if (p.right === n) {
        p.right = null;
      }
      stack.pop();
      for (let i = 0; i < stack.length; ++i) {
        stack[i]!.count--;
      }
      return new SortedMap(this.m.ord, stack[0]!);
    } else {
      if (n.left || n.right) {
        // single child black parent
        // black single child
        if (n.left) {
          swapNode(n, n.left);
        } else if (n.right) {
          swapNode(n, n.right);
        }
        //Child must be red, so repaint it black to balance color
        n.color = Color.B;
        for (let i = 0; i < stack.length - 1; ++i) {
          stack[i]!.count--;
        }
        return new SortedMap(this.m.ord, stack[0]!);
      } else if (stack.length === 1) {
        // root
        return new SortedMap(this.m.ord, null);
      } else {
        // black leaf no children
        for (let i = 0; i < stack.length; ++i) {
          stack[i]!.count--;
        }
        const parent = stack[stack.length - 2]!;
        fixDoubleBlack(stack);
        // fix links
        if (parent.left === n) {
          parent.left = null;
        } else {
          parent.right = null;
        }
      }
    }
    return new SortedMap(this.m.ord, stack[0]!);
  }
}
