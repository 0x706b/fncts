import type { Entry } from "./Entry.js";
import type { TryCommit } from "./TryCommit.js";
import type { AtomicReference } from "@fncts/base/internal/AtomicReference";
import type { Scheduler } from "@fncts/io/internal/Scheduler";
import type { Atomic } from "@fncts/io/TRef";
import type { TxnId } from "@fncts/io/TxnId";

import { defaultScheduler } from "@fncts/io/internal/Scheduler";
import { TExitTag } from "@fncts/io/TExit";

import { STMDriver } from "../driver.js";
import { CommitState } from "./CommitState.js";
import { Done, Suspend } from "./TryCommit.js";

/**
 * @tsplus type fncts.io.Journal
 */
export type Journal = Map<Atomic<any>, Entry>;

/**
 * @tsplus type fncts.io.JournalOps
 */
export interface JournalOps {}

export const Journal: JournalOps = {};

export type Todo = () => unknown;

/**
 * Creates a function that can reset the journal.
 *
 * @tsplus fluent fncts.io.Journal prepareReset
 */
export function prepareResetJournal(journal: Journal): () => unknown {
  const saved: Journal = new Map();
  for (const entry of journal) {
    saved.set(
      entry[0],
      entry[1].use((_) => _.copy()),
    );
  }
  return () => {
    journal.clear();
    for (const entry of saved) {
      journal.set(entry[0], entry[1]);
    }
  };
}

/**
 * Commits the journal.
 *
 * @tsplus fluent fncts.io.Journal commit
 */
export function commitJournal(journal: Journal) {
  for (const entry of journal.values()) {
    entry.use((entry) => entry.commit());
  }
}

type Invalid = -1;
const Invalid = -1;
type ReadOnly = 0;
const ReadOnly = 0;
type ReadWrite = 1;
const ReadWrite = 1;

type JournalAnalysis = Invalid | ReadOnly | ReadWrite;

/**
 * Analyzes the journal, determining whether it is valid and whether it is
 * read only in a single pass. Note that information on whether the
 * journal is read only will only be accurate if the journal is valid, due
 * to short-circuiting that occurs on an invalid journal.
 *
 * @tsplus fluent fncts.io.Journal analyze
 */
export function analyzeJournal(journal: Journal): JournalAnalysis {
  let result: JournalAnalysis = ReadOnly;
  for (const entry of journal) {
    result = entry[1].use((entry) => (entry.isInvalid() ? Invalid : entry.isChanged() ? ReadWrite : result));
    if (result === Invalid) {
      return result;
    }
  }
  return result;
}

/**
 * @tsplus static fncts.io.JournalOps emptyTodoMap
 */
export const emptyTodoMap = HashMap.makeDefault<TxnId, Todo>();

/**
 * Atomically collects and clears all the todos from any `TRef` that
 * participated in the transaction.
 *
 * @tsplus getter fncts.io.Journal collectTodos
 */
export function collectTodos(journal: Journal): Map<TxnId, Todo> {
  const allTodos: Map<TxnId, Todo> = new Map();

  for (const entry of journal) {
    const tref: Atomic<unknown> = entry[1].use((entry) => entry.tref as Atomic<unknown>);
    const todos                 = tref.todo.get;
    for (const todo of todos) {
      allTodos.set(todo[0], todo[1]);
    }
    tref.todo.set(emptyTodoMap);
  }

  return allTodos;
}

/**
 * Executes the todos in the current thread, sequentially.
 *
 * @tsplus fluent fncts.io.Journal execTodos
 */
export function execTodos(todos: Map<TxnId, Todo>) {
  for (const todo of todos.values()) {
    todo();
  }
}

/**
 * Runs all the todos.
 *
 * @tsplus fluent fncts.io.Journal completeTodos
 */
export function completeTodos<E, A>(journal: Journal, exit: Exit<E, A>, scheduler: Scheduler): Done<E, A> {
  const todos = collectTodos(journal);
  if (todos.size > 0) {
    scheduler.scheduleTask(() => execTodos(todos));
  }
  return new Done(exit);
}

/**
 * For the given transaction id, adds the specified todo effect to all
 * `TRef` values.
 *
 * @tsplus fluent fncts.io.Journal addTodo
 */
export function addTodo(journal: Journal, txnId: TxnId, todoEffect: Todo): boolean {
  let added = false;

  for (const entry of journal.values()) {
    const tref    = entry.use((entry) => entry.tref as Atomic<unknown>);
    const oldTodo = tref.todo.get;
    if (!oldTodo.has(txnId)) {
      const newTodo = oldTodo.set(txnId, todoEffect);
      tref.todo.set(newTodo);
      added = true;
    }
  }

  return added;
}

/**
 * Finds all the new todo targets that are not already tracked in the `oldJournal`.
 */
export function untrackedTodoTargets(oldJournal: Journal, newJournal: Journal): Journal {
  const untracked: Journal = new Map();
  for (const entry of newJournal) {
    const key   = entry[0];
    const value = entry[1];
    if (
      // We already tracked this one
      !oldJournal.has(key) &&
      // This `TRef` was created in the current transaction, so no need to
      // add any todos to it, because it cannot be modified from the outside
      // until the transaction succeeds; so any todo added to it would never
      // succeed.
      !value.use((_) => _.isNew)
    ) {
      untracked.set(key, value);
    }
  }
  return untracked;
}

export function tryCommitSync<R, E, A>(
  fiberId: FiberId,
  stm: STM<R, E, A>,
  r: Environment<R>,
  scheduler: Scheduler,
): TryCommit<E, A> {
  const journal: Journal = new Map();
  const value            = new STMDriver(stm, journal, fiberId, r).run();
  const analysis         = journal.analyze();
  if (analysis === ReadWrite) {
    journal.commit();
  } else if (analysis === Invalid) {
    throw new Error("Bug: invalid journal");
  }
  switch (value._tag) {
    case TExitTag.Retry: {
      return new Suspend(journal);
    }
    case TExitTag.Succeed: {
      return journal.completeTodos(Exit.succeed(value.value), scheduler);
    }
    case TExitTag.Fail: {
      return journal.completeTodos(Exit.fail(value.value), scheduler);
    }
    case TExitTag.Halt: {
      return journal.completeTodos(Exit.halt(value.value), scheduler);
    }
    case TExitTag.Interrupt: {
      return journal.completeTodos(Exit.interrupt(value.fiberId), scheduler);
    }
  }
}

function tryCommit<R, E, A>(
  fiberId: FiberId,
  stm: STM<R, E, A>,
  state: AtomicReference<CommitState<E, A>>,
  r: Environment<R>,
  scheduler: Scheduler,
): TryCommit<E, A> {
  const journal: Journal = new Map();
  const value            = new STMDriver(stm, journal, fiberId, r).run();
  const analysis         = journal.analyze();
  if (analysis === ReadWrite) {
    journal.commit();
  } else if (analysis === Invalid) {
    throw new Error("Bug: invalid journal");
  }
  state.set(CommitState.done(value));
  switch (value._tag) {
    case TExitTag.Retry: {
      return new Suspend(journal);
    }
    case TExitTag.Succeed: {
      return journal.completeTodos(Exit.succeed(value.value), scheduler);
    }
    case TExitTag.Fail: {
      return journal.completeTodos(Exit.fail(value.value), scheduler);
    }
    case TExitTag.Halt: {
      return journal.completeTodos(Exit.halt(value.value), scheduler);
    }
    case TExitTag.Interrupt: {
      return journal.completeTodos(Exit.interrupt(value.fiberId), scheduler);
    }
  }
}

function completeTryCommit<R, E, A>(exit: Exit<E, A>, k: (_: IO<R, E, A>) => unknown) {
  k(IO.fromExit(exit));
}

function suspendTryCommit<R, E, A>(
  fiberId: FiberId,
  stm: STM<R, E, A>,
  txnId: TxnId,
  state: AtomicReference<CommitState<E, A>>,
  r: Environment<R>,
  k: (_: IO<R, E, A>) => unknown,
  accum: Journal,
  journal: Journal,
  scheduler: Scheduler,
): void {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    journal.addTodo(txnId, () => tryCommitAsync(undefined, fiberId, stm, txnId, state, r, scheduler)(k));
    if (isInvalid(journal)) {
      const result = tryCommit(fiberId, stm, state, r, scheduler);
      switch (result._tag) {
        case "Done": {
          completeTryCommit(result.exit, k);
          return;
        }
        case "Suspend": {
          const untracked = untrackedTodoTargets(accum, result.journal);

          if (untracked.size > 0) {
            for (const entry of untracked) {
              accum.set(entry[0], entry[1]);
            }
            // eslint-disable-next-line no-param-reassign
            journal = untracked;
          }

          break;
        }
      }
    } else {
      return;
    }
  }
}

export function tryCommitAsync<R, E, A>(
  journal: Journal | undefined,
  fiberId: FiberId,
  stm: STM<R, E, A>,
  txnId: TxnId,
  state: AtomicReference<CommitState<E, A>>,
  r: Environment<R>,
  scheduler: Scheduler,
): (k: (_: IO<R, E, A>) => unknown) => void {
  return (k) => {
    if (state.get.isRunning) {
      if (journal != null) {
        suspendTryCommit(fiberId, stm, txnId, state, r, k, journal, journal, scheduler);
      } else {
        const result = tryCommitSync(fiberId, stm, r, scheduler);
        switch (result._tag) {
          case "Done": {
            completeTryCommit(result.exit, k);
            break;
          }
          case "Suspend": {
            suspendTryCommit(fiberId, stm, txnId, state, r, k, result.journal, result.journal, scheduler);
            break;
          }
        }
      }
    }
  };
}

/**
 * Determines if the journal is valid.
 *
 * @tsplus getter fncts.io.Journal isValid
 */
export function isValid(journal: Journal) {
  let valid = true;
  for (const entry of journal.values()) {
    valid = entry.use((entry) => entry.isValid());
    if (!valid) {
      return valid;
    }
  }
  return valid;
}

/**
 * Determines if the journal is invalid.
 *
 * @tsplus getter fncts.io.Journal isInvalid
 */
export function isInvalid(journal: Journal) {
  return !journal.isValid;
}
