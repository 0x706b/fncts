export interface Scheduler {
  scheduleTask(task: () => void): void;
}

export class AsyncScheduler implements Scheduler {
  private running = false;
  private tasks   = new ListBuffer<() => void>();

  private starveInternal(depth: number) {
    const toRun = this.tasks;
    this.tasks  = new ListBuffer();
    for (const task of toRun) {
      task();
    }
    if (this.tasks.isEmpty) {
      this.running = false;
    } else {
      this.starve(depth);
    }
  }

  starve(depth = 0) {
    if (depth >= 2048) {
      setTimeout(() => this.starveInternal(0), 0);
    } else {
      queueMicrotask(() => this.starveInternal(depth + 1));
    }
  }

  scheduleTask(task: () => void) {
    this.tasks.append(task);
    if (!this.running) {
      this.running = true;
      this.starve();
    }
  }
}

export const defaultScheduler: Scheduler = new AsyncScheduler();

export class StagedScheduler implements Scheduler {
  private tasks    = new ListBuffer<() => void>();
  private deferred = false;

  scheduleTask(task: () => void) {
    if (this.deferred) {
      defaultScheduler.scheduleTask(task);
    } else {
      this.tasks.append(task);
    }
  }

  flush() {
    while (!this.tasks.isEmpty) {
      this.tasks.unprepend()();
    }
    this.deferred = true;
  }
}
