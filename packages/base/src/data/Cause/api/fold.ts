import { CauseTag } from "../definition.js";

class BothCase {
  readonly _tag = "BothCase";
}

const _BothCase = new BothCase();

class ThenCase {
  readonly _tag = "ThenCase";
}

const _ThenCase = new ThenCase();

class StacklessCase {
  readonly _tag = "StacklessCase";
  constructor(readonly stackless: boolean) {}
}

type CauseCase = BothCase | ThenCase | StacklessCase;

/**
 * @tsplus tailRec
 */
function foldLoop<E, Z>(
  cases: {
    Empty: () => Z;
    Fail: (e: E, trace: Trace) => Z;
    Halt: (t: unknown, trace: Trace) => Z;
    Interrupt: (fiberId: FiberId, trace: Trace) => Z;
    Then: (l: Z, r: Z) => Z;
    Both: (l: Z, r: Z) => Z;
    Stackless: (z: Z, stackless: boolean) => Z;
  },
  inp: List<Cause<E>>,
  out: List<Either<CauseCase, Z>>,
): List<Z> {
  if (inp.isNonEmpty()) {
    const head   = inp.unsafeHead;
    const causes = inp.unsafeTail;
    switch (head._tag) {
      case CauseTag.Empty:
        return foldLoop(cases, causes, out.prepend(Either.right(cases.Empty())));
      case CauseTag.Fail:
        return foldLoop(cases, causes, out.prepend(Either.right(cases.Fail(head.value, head.trace))));
      case CauseTag.Halt:
        return foldLoop(cases, causes, out.prepend(Either.right(cases.Halt(head.value, head.trace))));
      case CauseTag.Interrupt:
        return foldLoop(cases, causes, out.prepend(Either.right(cases.Interrupt(head.id, head.trace))));
      case CauseTag.Both:
        return foldLoop(cases, Cons(head.left, Cons(head.right, causes)), out.prepend(Either.left(_BothCase)));
      case CauseTag.Then:
        return foldLoop(cases, Cons(head.left, Cons(head.right, causes)), out.prepend(Either.left(_ThenCase)));
      case CauseTag.Stackless:
        return foldLoop(cases, causes.prepend(head.cause), out.prepend(Either.left(new StacklessCase(head.stackless))));
    }
  } else {
    return out.foldLeft(List.empty(), (acc, v) => {
      if (v.isRight()) {
        return acc.prepend(v.right);
      } else {
        switch (v.left._tag) {
          case "BothCase": {
            const left   = acc.unsafeHead;
            const right  = acc.unsafeTail.unsafeHead;
            const causes = acc.unsafeTail.unsafeTail;
            return causes.prepend(cases.Both(left, right));
          }
          case "ThenCase": {
            const left   = acc.unsafeHead;
            const right  = acc.unsafeTail.unsafeHead;
            const causes = acc.unsafeTail.unsafeTail;
            return causes.prepend(cases.Then(left, right));
          }
          case "StacklessCase": {
            const cause  = acc.unsafeHead;
            const causes = acc.unsafeTail;
            return causes.prepend(cases.Stackless(cause, v.left.stackless));
          }
        }
      }
    });
  }
}

/**
 * Folds over a cause
 *
 * @tsplus fluent fncts.Cause fold
 */
export function fold_<E, Z>(
  self: Cause<E>,
  cases: {
    Empty: () => Z;
    Fail: (e: E, trace: Trace) => Z;
    Halt: (t: unknown, trace: Trace) => Z;
    Interrupt: (fiberId: FiberId, trace: Trace) => Z;
    Then: (l: Z, r: Z) => Z;
    Both: (l: Z, r: Z) => Z;
    Stackless: (z: Z, stackless: boolean) => Z;
  },
): Z {
  return foldLoop(cases, Cons(self, Nil()), List.empty()).unsafeHead;
}
