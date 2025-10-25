import type { UnsafeSink } from "../Push/Sink.js";
import type { Cause } from "@fncts/base/data/Cause";
import type { IO } from "@fncts/io/IO";

import { Push, PushTypeId } from "../Push.js";

export const SubjectTypeId = Symbol.for("fncts.io.Push.Subject");
export type SubjectTypeId = typeof SubjectTypeId;

/**
 * @tsplus type fncts.io.Push.Subject
 */
export abstract class PSubject<out EnvIn, out EnvOut, in ErrIn, out ErrOut, in In, Out>
  extends Push<EnvOut | Scope, ErrOut, Out>
  implements Push<EnvOut | Scope, ErrOut, Out>, UnsafeSink<EnvIn, ErrIn, In>
{
  readonly _pushOpCode                    = null;
  readonly [PushTypeId]: PushTypeId       = PushTypeId;
  readonly [SubjectTypeId]: SubjectTypeId = SubjectTypeId;

  abstract onSuccess(value: In): IO<EnvIn, never, void>;
  abstract onFailure(cause: Cause<ErrIn>): IO<EnvIn, never, void>;

  abstract interrupt: URIO<EnvIn, void>;

  abstract subscribers: number;
}

export type Subject<R, E, A> = PSubject<R, R, E, E, A, A>;

/**
 * @tsplus type fncts.io.Push.SubjectOps
 */
export interface SubjectOps {}

export const Subject: SubjectOps = {};
