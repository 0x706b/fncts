import type { Atomic } from "../control/TRef";

import { Versioned } from "./Versioned";

export const EntryTypeId = Symbol.for("fncts.data.Entry");
export type EntryTypeId = typeof EntryTypeId;

/**
 * @tsplus type fncts.control.Entry
 * @tsplus companion fncts.control.EntryOps
 */
export class Entry {
  readonly _typeId: EntryTypeId = EntryTypeId;

  constructor(readonly use: <X>(f: <S>(entry: ConcreteEntry<S>) => X) => X) {}
}

/**
 * @tsplus static fncts.control.EntryOps make
 */
export function make<A0>(tref0: Atomic<A0>, isNew0: boolean): Entry {
  const versioned = tref0.versioned;
  const ops       = new ConcreteEntry<A0>(
    tref0,
    versioned,
    versioned.value,
    isNew0,
    false
  );
  return new Entry((f) => f(ops));
}

export const ConcreteEntryTypeId = Symbol.for("fncts.data.ConcreteEntry");
export type ConcreteEntryTypeId = typeof ConcreteEntryTypeId;

export class ConcreteEntry<S> {
  readonly _typeId: ConcreteEntryTypeId = ConcreteEntryTypeId;

  constructor(
    readonly tref: Atomic<S>,
    readonly expected: Versioned<S>,
    protected newValue: S,
    readonly isNew: boolean,
    private _isChanged: boolean
  ) {}

  unsafeSet(value: unknown) {
    this._isChanged = true;
    this.newValue   = value as S;
  }

  unsafeGet<B>(): B {
    return this.newValue as unknown as B;
  }

  commit() {
    this.tref.versioned = new Versioned(this.newValue);
  }

  copy(): Entry {
    const ops = new ConcreteEntry<S>(
      this.tref,
      this.expected,
      this.newValue,
      this.isNew,
      this.isChanged()
    );
    return new Entry((f) => f(ops));
  }

  isInvalid() {
    return !this.isValid();
  }

  isValid() {
    return this.tref.versioned === this.expected;
  }

  isChanged() {
    return this._isChanged;
  }

  toString() {
    return `Entry(expected.value = ${this.expected.value}, newValue = ${
      this.newValue
    }, tref = ${this.tref}, isChanged = ${this.isChanged()})`;
  }
}
