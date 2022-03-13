export const enum Color {
  R,
  B,
}

export type Leaf = null;

export class Node<K, V> {
  constructor(
    public color: Color,
    public left: RBNode<K, V>,
    public key: K,
    public value: V,
    public right: RBNode<K, V>,
    public count: number,
  ) {}
}

export const Leaf = null;

export type RBNode<K, V> = Node<K, V> | Leaf;
