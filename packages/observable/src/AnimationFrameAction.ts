export class AnimationFrameAction<A> extends AsyncAction<A> {
  constructor(
    protected scheduler: AnimationFrameScheduler,
    protected work: (this: SchedulerAction<A>, state?: A) => void,
  ) {
    super(scheduler, work);
  }
  protected requestAsyncId(scheduler: AnimationFrameScheduler, delay = 0): any {
    if (delay != null && delay > 0) {
      return super.requestAsyncId(scheduler, delay);
    }
    scheduler.actions.push(this);
    return (scheduler.scheduled ||= animationFrameProvider.requestAnimationFrame(() => scheduler.flush(undefined)));
  }
  protected recycleAsyncId(scheduler: AnimationFrameScheduler, id?: any, delay = 0): any {
    if ((delay != null && delay > 0) || (delay == null && this.delay! > 0)) {
      super.recycleAsyncId(scheduler, delay);
    }
    if (scheduler.actions.length === 0) {
      animationFrameProvider.cancelAnimationFrame(id);
      scheduler.scheduled = undefined;
    }
    return undefined;
  }
}
