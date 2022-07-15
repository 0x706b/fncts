const x = new Observable<never, void>((subscriber) => {
  setInterval(() => {
    subscriber.next(undefined);
  }, 1000);
});

new Observable<string, number>((subscriber) => {
  let i        = 0;
  const handle = setInterval(() => {
    if (i === 100) {
      subscriber.error(Cause.fail("lmao"));
    } else {
      subscriber.next(i++);
    }
  }, 100);
  subscriber.add(() => {
    clearInterval(handle);
  });
})
  .share()
  .window(x)
  .subscribe({
    next: (value) => {
      value.subscribe(console.log.bind(console));
    },
    error: (cause) => {
      console.log(cause);
    },
  });
