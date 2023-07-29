suite.concurrent("Duration", () => {
  test("milliseconds", Duration.milliseconds(1).milliseconds.assert(strictEqualTo(1)));
  test("seconds", Duration.seconds(1).milliseconds.assert(strictEqualTo(1000)));
  test("minutes", Duration.minutes(1).milliseconds.assert(strictEqualTo(60000)));
  test("hours", Duration.hours(1).milliseconds.assert(strictEqualTo(3600000)));
  test("days", Duration.days(1).milliseconds.assert(strictEqualTo(86400000)));
  test("product", (Duration.milliseconds(100) * 2).milliseconds.assert(strictEqualTo(200)));
  test("sum", ((100).milliseconds + (50).milliseconds).milliseconds.assert(strictEqualTo(150)));
  test("difference", ((100).milliseconds - (50).milliseconds).milliseconds.assert(strictEqualTo(50)));
  test("fromInterval", Duration.fromInterval(500, 1000).milliseconds.assert(strictEqualTo(500)));
  test(
    "lessThanOrEqualTo",
    ((50).milliseconds <= (50).milliseconds).assert(isTrue) &&
      ((100).milliseconds <= (50).milliseconds).assert(isFalse) &&
      ((50).milliseconds <= (100).milliseconds).assert(isTrue),
  );
  test(
    "greaterThanOrEqualTo",
    ((50).milliseconds >= (50).milliseconds).assert(isTrue) &&
      ((100).milliseconds >= (50).milliseconds).assert(isTrue) &&
      ((50).milliseconds >= (100).milliseconds).assert(isFalse),
  );
  test(
    "lessThan",
    ((100).milliseconds < (50).milliseconds).assert(isFalse) && ((50).milliseconds < (100).milliseconds).assert(isTrue),
  );
  test(
    "greaterThan",
    ((100).milliseconds > (50).milliseconds).assert(isTrue) && ((50).milliseconds > (100).milliseconds).assert(isFalse),
  );
});
