Source.interval(1000)
  .mergeMap((n) => Source.interval((n + 1) * 1000))
  .subscribe((n) => {
    console.log(n);
  });
