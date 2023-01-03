import type { Scheduler } from "@fncts/io/internal/Scheduler";

/** @internal */
declare global {
  interface Navigator {
    scheduling:
      | {
          isInputPending: (() => boolean) | undefined;
        }
      | undefined;
  }
  function cancelAnimationFrame(handle: number | undefined): void;
  function cancelIdleCallback(handle: number | undefined): void;
}

interface WhenReady<T> {
  promise: () => Promise<T>;
  resolve: (value: T) => void;
}

function whenReady<T>(): WhenReady<T> {
  const observers: Array<(value: T) => void> = [];

  const promise = () => new Promise<T>((resolve) => observers.push(resolve));

  return {
    promise,
    resolve: (value) => observers.forEach((observer) => observer(value)),
  };
}

interface Task {
  ready: () => Promise<void>;
  resolve: () => void;
}

interface State {
  tasks: Array<Task>;
  frameTimeElapsed: boolean;
  onIdleCallback: WhenReady<void>;
  onAnimationFrame: WhenReady<void>;
  frameWorkStartTime: number | undefined;
  idleDeadline: IdleDeadline | undefined;
}

export class BackgroundScheduler implements Scheduler {
  state: State = {
    tasks: [],
    idleDeadline: undefined,
    frameTimeElapsed: false,
    onIdleCallback: whenReady(),
    onAnimationFrame: whenReady(),
    frameWorkStartTime: undefined,
  };

  isTracking = false;
  idleCallbackId: number | undefined;
  lastCallTime = 0;
  lastResult   = false;
  globalId     = 0;
  running      = new Set<number>();
  callbacks: Array<() => void> = [];
  promiseEscapeId: number | undefined;

  scheduleTask(task: () => void) {
    this.yieldBackgroundOrContinue().then(() => {
      task();
    });
  }

  createTask(): Task {
    const wr   = whenReady<void>();
    const item = { ready: wr.promise, resolve: wr.resolve };
    this.state.tasks.push(item);
    if (this.state.tasks.length === 1) {
      this.startTracking();
    }
    return item;
  }

  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;

    const reset = () => {
      this.state.idleDeadline       = undefined;
      this.state.frameTimeElapsed   = false;
      this.state.frameWorkStartTime = undefined;
    };

    const loop = () => {
      if (typeof requestIdleCallback !== "undefined") {
        this.idleCallbackId = requestIdleCallback((deadline) => {
          reset();
          this.state.idleDeadline = deadline;
          this.state.onIdleCallback.resolve();
          this.state.onIdleCallback = whenReady();
        });
      }

      const cb = () => {
        reset();
        this.state.onAnimationFrame.resolve();
        this.state.onAnimationFrame = whenReady();
        if (this.state.tasks.length === 0) {
          this.isTracking = false;
          if (typeof cancelIdleCallback !== "undefined") {
            cancelIdleCallback(this.idleCallbackId);
          }
        } else {
          loop();
        }
      };

      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(cb);
      } else {
        setTimeout(cb, 0);
      }
    };

    loop();
  }

  removeTask(task: Task) {
    const index = this.state.tasks.indexOf(task);
    if (index !== -1) {
      this.state.tasks.splice(index, 1);
    }
  }

  nextTask() {
    if (this.state.tasks.length > 0) {
      this.state.tasks[0]!.resolve();
    }
  }

  isTimeToYield(): boolean {
    const now = Date.now();

    if (!this.lastResult && now - this.lastCallTime === 0) {
      return this.lastResult;
    }

    this.lastCallTime = now;
    this.lastResult =
      now >= this.calculateDeadline() ||
      (typeof navigator !== "undefined" && navigator.scheduling?.isInputPending?.() === true);

    if (this.lastResult) {
      this.state.frameTimeElapsed = true;
    }

    return this.lastResult;
  }

  calculateDeadline(): number {
    if (this.state.frameWorkStartTime === undefined) {
      return -1;
    }

    const idleDeadline =
      this.state.idleDeadline === undefined
        ? Number.MAX_SAFE_INTEGER
        : Date.now() + this.state.idleDeadline.timeRemaining();

    return Math.min(this.state.frameWorkStartTime + 5, idleDeadline);
  }

  requestPromiseEscape(callback: () => void): number {
    const id = this.globalId;

    this.running.add(id);

    Promise.resolve().then(() => {
      Promise.resolve().then(() => {
        if (this.running.has(id)) {
          callback();
          this.running.delete(id);
        }
      });
    });

    this.globalId += 1;

    return id;
  }

  cancelPromiseEscape(id: number | undefined): void {
    if (id !== undefined) {
      this.running.delete(id);
    }
  }

  requestNextTask(callback: () => void): void {
    if (this.callbacks.length === 0) {
      const channel = new MessageChannel();
      channel.port2.postMessage(undefined);
      channel.port1.onmessage = (): void => {
        channel.port1.close();
        channel.port2.close();

        const callbacksCopy = this.callbacks;
        this.callbacks      = [];
        for (const callback of callbacksCopy) {
          callback();
        }
      };
    }

    this.callbacks.push(callback);
  }

  async yieldControl(): Promise<void> {
    this.cancelPromiseEscape(this.promiseEscapeId);

    const task = this.createTask();

    await this.schedule();

    if (this.state.tasks[0] !== task) {
      await task.ready();
      if (this.isTimeToYield()) {
        await this.schedule();
      }
    }

    this.removeTask(task);

    this.cancelPromiseEscape(this.promiseEscapeId);

    this.promiseEscapeId = this.requestPromiseEscape(() => {
      this.nextTask();
    });
  }

  async schedule(): Promise<void> {
    if (this.state.frameTimeElapsed) {
      await this.state.onAnimationFrame.promise();
    }

    if (typeof requestIdleCallback === "undefined") {
      await new Promise<void>((resolve) => this.requestNextTask(resolve));

      if (typeof navigator !== "undefined" && navigator.scheduling?.isInputPending?.() === true) {
        await this.schedule();
      } else if (this.state.frameWorkStartTime === undefined) {
        this.state.frameWorkStartTime = Date.now();
      }
    } else {
      await this.state.onIdleCallback.promise();

      if (this.state.frameWorkStartTime === undefined) {
        this.state.frameWorkStartTime = Date.now();
      }
    }
  }

  yieldBackgroundOrContinue(): Promise<void> {
    if (this.isTimeToYield()) {
      return this.yieldControl();
    }

    return Promise.resolve();
  }
}

export const backgroundScheduler = new BackgroundScheduler();
