import { Iterable } from "./collection/immutable/Iterable";
import { IO } from "./control/IO";
import { Stream } from "./control/Stream/definition";

async function wait(n: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, n);
  });
}

const iter = {
  async *[Symbol.asyncIterator]() {
    let i = 0;
    while (true) {
      await wait(i);
      yield i++;
    }
  },
};

Stream.fromAsyncIterable(iter)
  .take(100)
  .mapIO((n) => IO(console.log(n)))
  .runDrain.unsafeRunAsync();
