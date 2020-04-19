import { BelT, ExpressionHandler } from "./type";

export abstract class Continuation {
  k: Continuation | null;

  abstract resume(v: BelT): void;

  constructor(k: Continuation | null) {
    this.k = k;
  }
}

export class BaseCont extends Continuation {
  f: ExpressionHandler;

  constructor(k: Continuation | null, f: ExpressionHandler) {
    super(k);

    this.f = f;
  }

  resume(v: BelT): void {
    this.f(v);
  }
}
