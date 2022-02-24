import type { FiberId } from "../../data/FiberId";
import type { Journal } from "../../internal/Journal";
import type { OnFailure, OnRetry, OnSuccess } from "../STM";

import { TExit } from "../../data/TExit";
import { Stack } from "../../internal/Stack";
import { STM, STMTag } from "../STM";
import {
  concrete,
  isFailException,
  isHaltException,
  isInterruptException,
  isRetryException,
} from "./definition";

type Erased = STM<unknown, unknown, unknown>;
type Cont =
  | OnFailure<unknown, unknown, unknown, unknown>
  | OnRetry<unknown, unknown, unknown>
  | OnSuccess<unknown, unknown, unknown, unknown>;

export class STMDriver<R, E, A> {
  private contStack: Stack<Cont> | undefined;
  private envStack: Stack<unknown>;

  constructor(
    readonly self: STM<R, E, A>,
    readonly journal: Journal,
    readonly fiberId: FiberId,
    r0: R,
  ) {
    this.envStack = Stack.make(r0);
  }

  private unwindStack(error: unknown, isRetry: boolean): Erased | undefined {
    let result: Erased | undefined = undefined;
    while (this.contStack && !result) {
      const cont     = this.contStack.value;
      this.contStack = this.contStack.previous;
      if (cont._tag === STMTag.OnFailure) {
        if (!isRetry) {
          result = cont.onFailure(error);
        }
      }
      if (cont._tag === STMTag.OnRetry) {
        if (isRetry) {
          result = cont.onRetry;
        }
      }
    }
    return result;
  }

  run(): TExit<E, A> {
    let curr = this.self as Erased | undefined;
    let exit: TExit<unknown, unknown> | undefined = undefined;

    while (!exit && curr) {
      const k = curr;
      concrete(k);
      switch (k._tag) {
        case STMTag.Succeed: {
          const a = k.a();
          if (!this.contStack) {
            exit = TExit.succeed(a);
          } else {
            const cont     = this.contStack.value;
            this.contStack = this.contStack.previous;
            curr           = cont.apply(a);
          }
          break;
        }
        case STMTag.SucceedNow: {
          const a = k.a;
          if (!this.contStack) {
            exit = TExit.succeed(a);
          } else {
            const cont     = this.contStack.value;
            this.contStack = this.contStack.previous;
            curr           = cont.apply(a);
          }
          break;
        }
        case STMTag.Gives: {
          this.envStack = Stack.make(k.f(this.envStack.value), this.envStack);
          curr          = k.stm.ensuring(
            STM.succeed(() => {
              this.envStack = this.envStack.previous!;
            }),
          );
          break;
        }
        case STMTag.OnRetry: {
          this.contStack = Stack.make(k, this.contStack);
          curr           = k.stm;
          break;
        }
        case STMTag.OnFailure: {
          this.contStack = Stack.make(k, this.contStack);
          curr           = k.stm;
          break;
        }
        case STMTag.OnSuccess: {
          this.contStack = Stack.make(k, this.contStack);
          curr           = k.stm;
          break;
        }
        case STMTag.Effect: {
          try {
            const a = k.f(this.journal, this.fiberId, this.envStack.value);
            if (!this.contStack) {
              exit = TExit.succeed(a);
            } else {
              const cont     = this.contStack.value;
              this.contStack = this.contStack.previous;
              curr           = cont.apply(a);
            }
          } catch (e) {
            if (isFailException(e)) {
              curr = this.unwindStack(e.e, false);
              if (!curr) {
                exit = TExit.fail(e.e);
              }
            } else if (isRetryException(e)) {
              curr = this.unwindStack(undefined, true);
              if (!curr) {
                exit = TExit.retry;
              }
            } else if (isHaltException(e)) {
              curr = this.unwindStack(e.e, false);
              if (!curr) {
                exit = TExit.halt(e.e);
              }
            } else if (isInterruptException(e)) {
              exit = TExit.interrupt(e.fiberId);
            } else {
              throw e;
            }
          }
        }
      }
    }

    return exit as TExit<E, A>;
  }
}
