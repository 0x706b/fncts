import { IO } from "./control/IO";
import { Random } from "./control/Random";
import { Stream } from "./control/Stream";

const effect =
  Random.setSeed(0) >
  Stream.repeatIO(Random.nextInt)
    .take(100)
    .mapIO((n) => IO(console.log(n))).runDrain;

effect.unsafeRunAsyncWith((exit) => {
  console.log(exit);
});
