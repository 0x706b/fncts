export class AsyncScheduler extends Scheduler {
  public actions: Array<AsyncAction<any>> = [];

  active         = false;
  scheduled: any = undefined;

  constructor(actionConstructor: typeof Action, now: () => number = Scheduler.now) {
    super(actionConstructor, now);
  }

  flush(action: AsyncAction<any>) {
    const { actions } = this;

    if (this.active) {
      actions.push(action);
      return;
    }

    let error: unknown;
    this.active = true;

    do {
      if ((error = action.execute(action.state, action.delay!))) {
        break;
      }
    } while ((action = actions.shift()!));

    this.active = false;

    if (error) {
      while ((action = actions.shift()!)) {
        action.unsubscribe();
      }
      throw error;
    }
  }
}

export const asyncScheduler = new AsyncScheduler(AsyncAction);
