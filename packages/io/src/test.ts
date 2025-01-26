/**
 * @tsplus implicit
 */
export class Service extends IO.Tag<
  Service,
  {
    log: (v: unknown) => void;
  }
>() {}

Service.log("hello, world!")
  .provideService(
    {
      log: (v: unknown) => {
        console.log(v);
      },
    },
    Service,
  )
  .unsafeRunPromiseExit()
  .then((exit) => {
    console.log(exit);
  });
