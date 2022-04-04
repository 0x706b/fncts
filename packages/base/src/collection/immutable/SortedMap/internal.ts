import type { RBNode } from "@fncts/base/collection/immutable/SortedMap/node";
import type { Ordering } from "@fncts/base/prelude";

import { Color, Leaf, Node } from "@fncts/base/collection/immutable/SortedMap/node";

export function swapNode<K, V>(node: Node<K, V>, v: Node<K, V>): void {
  node.key   = v.key;
  node.value = v.value;
  node.left  = v.left;
  node.right = v.right;
  node.color = v.color;
  node.count = v.count;
}

export function isEmptyNode<K, V>(node: RBNode<K, V>): node is Leaf {
  return node === null;
}

function repaintNode<K, V>(n: RBNode<K, V>, c: Color): RBNode<K, V> {
  return n === Leaf ? Leaf : new Node(c, n.left, n.key, n.value, n.right, n.count);
}

function cloneNode<K, V>(n: RBNode<K, V>): RBNode<K, V> {
  return n === Leaf ? Leaf : new Node(n.color, n.left, n.key, n.value, n.right, n.count);
}

function recountNode<K, V>(n: Node<K, V>): void {
  n.count = 1 + (n.left ? n.left.count : 0) + (n.right ? n.right.count : 0);
}

export function rebuildModifiedPath<K, V>(
  nodeStack: Array<Node<K, V>>,
  orderStack: Array<Ordering>,
  inc = 1,
): void {
  for (let s = nodeStack.length - 2; s >= 0; --s) {
    const n = nodeStack[s]!;
    if (orderStack[s]! <= 0) {
      nodeStack[s] = new Node(n.color, nodeStack[s + 1]!, n.key, n.value, n.right, n.count + inc);
    } else {
      nodeStack[s] = new Node(n.color, n.left, n.key, n.value, nodeStack[s + 1]!, n.count + inc);
    }
  }
}

export function balanceModifiedPath<K, V>(nodeStack: Array<Node<K, V>>): void {
  for (let s = nodeStack.length - 1; s > 1; --s) {
    const parent = nodeStack[s - 1]!;
    const node   = nodeStack[s]!;
    if (parent.color === Color.B || node.color === Color.B) {
      break;
    }
    const gparent = nodeStack[s - 2]!;
    if (gparent.left === parent) {
      if (parent.left === node) {
        const parsib = gparent.right;
        if (parsib && parsib.color === Color.R) {
          parent.color  = Color.B;
          gparent.right = repaintNode(parsib, Color.B);
          gparent.color = Color.R;
          s            -= 1;
        } else {
          gparent.color    = Color.R;
          gparent.left     = parent.right;
          parent.color     = Color.B;
          parent.right     = gparent;
          nodeStack[s - 2] = parent;
          nodeStack[s - 1] = node;
          recountNode(gparent);
          recountNode(parent);
          if (s >= 3) {
            const ggparent = nodeStack[s - 3]!;
            if (ggparent.left === gparent) {
              ggparent.left = parent;
            } else {
              ggparent.right = parent;
            }
          }
          break;
        }
      } else {
        const uncle = gparent.right;
        if (uncle && uncle.color === Color.R) {
          parent.color  = Color.B;
          gparent.right = repaintNode(uncle, Color.B);
          gparent.color = Color.R;
          s            -= 1;
        } else {
          parent.right     = node.left;
          gparent.color    = Color.R;
          gparent.left     = node.right;
          node.color       = Color.B;
          node.left        = parent;
          node.right       = gparent;
          nodeStack[s - 2] = node;
          nodeStack[s - 1] = parent;
          recountNode(gparent);
          recountNode(parent);
          recountNode(node);
          if (s >= 3) {
            const ggparent = nodeStack[s - 3]!;
            if (ggparent.left === gparent) {
              ggparent.left = node;
            } else {
              ggparent.right = node;
            }
          }
          break;
        }
      }
    } else {
      if (parent.right === node) {
        const parsib = gparent.left;
        if (parsib && parsib.color === Color.R) {
          parent.color  = Color.B;
          gparent.left  = repaintNode(parsib, Color.B);
          gparent.color = Color.R;
          s            -= 1;
        } else {
          gparent.color    = Color.R;
          gparent.right    = parent.left;
          parent.color     = Color.B;
          parent.left      = gparent;
          nodeStack[s - 2] = parent;
          nodeStack[s - 1] = node;
          recountNode(gparent);
          recountNode(parent);
          if (s >= 3) {
            const ggparent = nodeStack[s - 3]!;
            if (ggparent.right === gparent) {
              ggparent.right = parent;
            } else {
              ggparent.left = parent;
            }
          }
          break;
        }
      } else {
        const parsib = gparent.left;
        if (parsib && parsib.color === Color.R) {
          parent.color  = Color.B;
          gparent.left  = repaintNode(parsib, Color.B);
          gparent.color = Color.R;
          s            -= 1;
        } else {
          parent.left      = node.right;
          gparent.color    = Color.R;
          gparent.right    = node.left;
          node.color       = Color.B;
          node.right       = parent;
          node.left        = gparent;
          nodeStack[s - 2] = node;
          nodeStack[s - 1] = parent;
          recountNode(gparent);
          recountNode(parent);
          recountNode(node);
          if (s >= 3) {
            const ggparent = nodeStack[s - 3]!;
            if (ggparent.right === gparent) {
              ggparent.right = node;
            } else {
              ggparent.left = node;
            }
          }
          break;
        }
      }
    }
  }
  nodeStack[0]!.color = Color.B;
}

export function fixDoubleBlack<K, V>(stack: Array<Node<K, V>>): void {
  let node: Node<K, V>, parent: Node<K, V>, sibling: RBNode<K, V>, nibling: RBNode<K, V>;
  for (let i = stack.length - 1; i >= 0; --i) {
    node = stack[i]!;
    if (i === 0) {
      node.color = Color.B;
      return;
    }
    parent = stack[i - 1]!;
    if (parent.left === node) {
      // left child
      sibling = parent.right;
      if (sibling && sibling.right && sibling.right.color === Color.R) {
        // right sibling child red
        sibling        = parent.right = cloneNode(sibling);
        nibling        = sibling!.right = cloneNode(sibling!.right);
        parent.right   = sibling!.left;
        sibling!.left  = parent;
        sibling!.right = nibling;
        sibling!.color = parent.color;
        node.color     = Color.B;
        parent.color   = Color.B;
        nibling!.color = Color.B;
        recountNode(parent);
        recountNode(sibling!);
        if (i > 1) {
          const pp = stack[i - 2]!;
          if (pp.left === parent) {
            pp.left = sibling;
          } else {
            pp.right = sibling;
          }
        }
        stack[i - 1] = sibling!;
        return;
      } else if (sibling && sibling.left && sibling.left.color === Color.R) {
        // left sibling child red
        sibling        = parent.right = cloneNode(sibling);
        nibling        = sibling!.left = cloneNode(sibling!.left);
        parent.right   = nibling!.left;
        sibling!.left  = nibling!.right;
        nibling!.left  = parent;
        nibling!.right = sibling;
        nibling!.color = parent.color;
        parent.color   = Color.B;
        sibling!.color = Color.B;
        node.color     = Color.B;
        recountNode(parent);
        recountNode(sibling!);
        recountNode(nibling!);
        if (i > 1) {
          const pp = stack[i - 2]!;
          if (pp.left === parent) {
            pp.left = nibling;
          } else {
            pp.right = nibling;
          }
        }
        stack[i - 1] = nibling!;
        return;
      }
      if (sibling!.color === Color.B) {
        if (parent.color === Color.R) {
          // black sibling, red parent
          parent.color = Color.B;
          parent.right = repaintNode(sibling!, Color.R);
          return;
        } else {
          // black sibling, black parent
          parent.right = repaintNode(sibling!, Color.R);
          continue;
        }
      } else {
        // red sibling
        sibling        = cloneNode(sibling);
        parent.right   = sibling!.left;
        sibling!.left  = parent;
        sibling!.color = parent.color;
        parent!.color  = Color.R;
        recountNode(parent);
        recountNode(sibling!);
        if (i > 1) {
          const pp = stack[i - 2]!;
          if (pp.left === parent) {
            pp.left = sibling;
          } else {
            pp.right = sibling;
          }
        }
        stack[i - 1] = sibling!;
        stack[i]     = parent;
        if (i + 1 < stack.length) {
          stack[i + 1] = node;
        } else {
          stack.push(node);
        }
        i += 2;
      }
    } else {
      // right child
      sibling = parent.left;
      if (sibling && sibling.left && sibling.left.color === Color.R) {
        // left sibling child red
        sibling        = parent.left = cloneNode(sibling);
        nibling        = sibling!.left = cloneNode(sibling!.left);
        parent.left    = sibling!.right;
        sibling!.right = parent;
        sibling!.left  = nibling;
        sibling!.color = parent.color;
        node.color     = Color.B;
        parent.color   = Color.B;
        nibling!.color = Color.B;
        recountNode(parent);
        recountNode(sibling!);
        if (i > 1) {
          const pp = stack[i - 2]!;
          if (pp.right === parent) {
            pp.right = sibling;
          } else {
            pp.left = sibling;
          }
        }
        stack[i - 1] = sibling!;
        return;
      } else if (sibling && sibling.right && sibling.right.color === Color.R) {
        // right sibling child red
        sibling        = parent.left = cloneNode(sibling);
        nibling        = sibling!.right = cloneNode(sibling!.right);
        parent.left    = nibling!.right;
        sibling!.right = nibling!.left;
        nibling!.right = parent;
        nibling!.left  = sibling;
        nibling!.color = parent.color;
        parent.color   = Color.B;
        sibling!.color = Color.B;
        node.color     = Color.B;
        recountNode(parent);
        recountNode(sibling!);
        recountNode(nibling!);
        if (i > 1) {
          const pp = stack[i - 2]!;
          if (pp.right === parent) {
            pp.right = nibling;
          } else {
            pp.left = nibling;
          }
        }
        stack[i - 1] = nibling!;
        return;
      }
      if (sibling!.color === Color.B) {
        if (parent.color === Color.R) {
          // black sibling, red parent
          parent.color = Color.B;
          parent.left  = repaintNode(sibling!, Color.R);
          return;
        } else {
          // black sibling, black, parent
          parent.left = repaintNode(sibling!, Color.R);
          continue;
        }
      } else {
        // red sibling
        sibling        = cloneNode(sibling);
        parent.left    = sibling!.right;
        sibling!.right = parent;
        sibling!.color = parent.color;
        parent.color   = Color.R;
        recountNode(parent);
        recountNode(sibling!);
        if (i > 1) {
          const pp = stack[i - 2]!;
          if (pp.right === parent) {
            pp.right = sibling;
          } else {
            pp.left = sibling;
          }
        }
        stack[i - 1] = sibling!;
        stack[i]     = parent;
        if (i + 1 < stack.length) {
          stack[i + 1] = node;
        } else {
          stack.push(node);
        }
        i += 2;
      }
    }
  }
}
