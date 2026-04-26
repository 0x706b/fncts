declare global {
  interface ImportMeta {
    env: {
      CI: boolean;
    };
  }
}
