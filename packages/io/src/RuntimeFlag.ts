export const enum RuntimeFlag {
  Interruption = 1 << 0,
  CurrentFiber = 1 << 1,
  OpLog = 1 << 2,
  OpSupervision = 1 << 3,
  RuntimeMetrics = 1 << 4,
  FiberRoots = 1 << 5,
  WindDown = 1 << 6,
  CooperativeYielding = 1 << 7,
}
