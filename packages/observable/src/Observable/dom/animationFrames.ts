import { animationFrameProvider } from "@fncts/observable/internal/animationFrameProvider";
import { performanceTimestampProvider } from "@fncts/observable/internal/performanceTimestampProvider";

export function animationFrames(
  timestampProvider?: TimestampProvider,
): Observable<never, never, { timestamp: number; elapsed: number }> {
  return timestampProvider ? animationFramesInternal(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
}

function animationFramesInternal(
  timestampProvider?: TimestampProvider,
): Observable<never, never, { timestamp: number; elapsed: number }> {
  const { schedule } = animationFrameProvider;
  return new Observable((subscriber) => {
    const subscription = new Subscription();
    const provider     = timestampProvider || performanceTimestampProvider;
    const start        = provider.now();
    const run          = (timestamp: number) => {
      const now = provider.now();
      subscriber.next({
        timestamp: timestampProvider ? now : timestamp,
        elapsed: now - start,
      });
      if (!subscriber.closed) {
        subscription.add(schedule(run));
      }
    };
    subscription.add(schedule(run));
    return subscription;
  });
}

const DEFAULT_ANIMATION_FRAMES = animationFramesInternal();
