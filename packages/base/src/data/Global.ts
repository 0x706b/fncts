const globalStoreId = Symbol.for("fncts.GlobalStore");

if (!(globalStoreId in globalThis)) {
  (globalThis as any)[globalStoreId] = new Map();
}

const globalStore = (globalThis as any)[globalStoreId] as Map<unknown, any>;

/**
 * @since 1.0.0
 */
export const globalValue = <A>(id: unknown, compute: () => A): A => {
  if (!globalStore.has(id)) {
    globalStore.set(id, compute());
  }
  return globalStore.get(id)!;
};
