IO.succeed(console.log(1))
  .flatMap(() => IO.halt("lmao"))
  .catchAllCause((cause) => IO(console.log("failed")))
  .unsafeRunWith((exit) => {
    console.log(exit);
  });
