export class ServiceNotFoundError extends Error {
  constructor(readonly tag: Tag<any, any>) {
    super(`Service not found: ${tag.id}`);
  }
}
