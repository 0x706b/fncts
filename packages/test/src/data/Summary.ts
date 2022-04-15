export class Summary {
  constructor(readonly success: number, readonly fail: number, readonly ignore: number, readonly summary: string) {}
  total = this.success + this.fail + this.ignore;
}
