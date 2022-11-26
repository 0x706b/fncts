import type { OnFailure, OnRetry, OnSuccess } from "../STM.js";
import type { Journal } from "./internal/Journal.js";

import { Stack } from "@fncts/base/internal/Stack";

import { STMTag } from "../STM.js";
import { concrete, isFailException, isHaltException, isInterruptException, isRetryException } from "./definition.js";

type Erased = STM<unknown, unknown, unknown>;
type Cont =
  | OnFailure<unknown, unknown, unknown, unknown>
  | OnRetry<unknown, unknown, unknown>
  | OnSuccess<unknown, unknown, unknown, unknown>;

export class STMDriver<R, E, A> {
  private contStack: Stack<Cont>;
  private envStack: Stack<Environment<unknown>>;

  constructor(readonly self: STM<R, E, A>, readonly journal: Journal, readonly fiberId: FiberId, r0: Environment<R>) {
    this.contStack = Stack();
    this.envStack  = Stack.single(r0);
  }

  private unwindStack(error: unknown, isRetry: boolean): Erased | undefined {
    let result: Erased | undefined = undefined;
    while (this.contStack.hasNext && !result) {
      const cont = this.contStack.pop()!;
      if (cont.stmOpCode === STMTag.OnFailure) {
        if (!isRetry) {
          result = cont.onFailure(error);
        }
      }
      if (cont.stmOpCode === STMTag.OnRetry) {
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
      switch (k.stmOpCode) {
        case STMTag.Succeed: {
          const a = k.a();
          if (!this.contStack.hasNext) {
            exit = TExit.succeed(a);
          } else {
            const cont = this.contStack.pop()!;
            curr       = cont.apply(a);
          }
          break;
        }
        case STMTag.SucceedNow: {
          const a = k.a;
          if (!this.contStack.hasNext) {
            exit = TExit.succeed(a);
          } else {
            const cont = this.contStack.pop()!;
            curr       = cont.apply(a);
          }
          break;
        }
        case STMTag.ContramapEnvironment: {
          this.envStack.push(k.f(this.envStack.peek() ?? Environment()));
          curr = k.stm.ensuring(
            STM.succeed(() => {
              this.envStack.pop();
            }),
          );
          break;
        }
        case STMTag.OnRetry: {
          this.contStack.push(k);
          curr = k.stm;
          break;
        }
        case STMTag.OnFailure: {
          this.contStack.push(k);
          curr = k.stm;
          break;
        }
        case STMTag.OnSuccess: {
          this.contStack.push(k);
          curr = k.stm;
          break;
        }
        case STMTag.Effect: {
          try {
            const a = k.f(this.journal, this.fiberId, this.envStack.peek() ?? Environment());
            if (!this.contStack.hasNext) {
              exit = TExit.succeed(a);
            } else {
              const cont = this.contStack.pop()!;
              curr       = cont.apply(a);
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
