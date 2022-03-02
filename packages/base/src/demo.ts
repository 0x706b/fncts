import { Conc } from "./collection/immutable/Conc";
import { IO } from "./control/IO";
import { Stream } from "./control/Stream";

Stream.fromChunk(Conc(2, 3))
  .interleave(Stream.fromChunk(Conc(5, 6, 7)))
  .runCollect.chain((c) =>
    IO(
      c.forEach((n) => {
        console.log(n);
      }),
    ),
  )
  .unsafeRunAsyncWith((exit) => {
    console.log(exit);
  });
