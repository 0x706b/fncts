/**
 * @tsplus type fncts.test.data.TestConfig
 * @tsplus companion fncts.test.data.TestConfigOps
 */
export abstract class TestConfig {
  abstract readonly repeats: number;
  abstract readonly retries: number;
  abstract readonly samples: number;
  abstract readonly shrinks: number;
}

/**
 * @tsplus static fncts.test.data.TestConfigOps Tag
 */
export const TestConfigTag = Tag<TestConfig>();

/**
 * @tsplus static fncts.test.data.TestConfigOps Live
 */
export function live(_: TestConfig): Layer<unknown, never, Has<TestConfig>> {
  return Layer.succeed(
    new (class extends TestConfig {
      repeats = _.repeats;
      retries = _.retries;
      samples = _.samples;
      shrinks = _.shrinks;
    })(),
    TestConfig.Tag,
  );
}

/**
 * @tsplus static fncts.test.data.TestConfigOps repeats
 */
export const repeats = IO.serviceWith((_: TestConfig) => _.repeats, TestConfig.Tag);
/**
 * @tsplus static fncts.test.data.TestConfigOps retries
 */
export const retries = IO.serviceWith((_: TestConfig) => _.retries, TestConfig.Tag);
/**
 * @tsplus static fncts.test.data.TestConfigOps samples
 */
export const samples = IO.serviceWith((_: TestConfig) => _.samples, TestConfig.Tag);
/**
 * @tsplus static fncts.test.data.TestConfigOps shrinks
 */
export const shrinks = IO.serviceWith((_: TestConfig) => _.shrinks, TestConfig.Tag);
